const questions = require('./questions');
const stringSimilarity = require('string-similarity');

class GameManager {
    constructor(io) {
        this.io = io;
        this.rooms = {};
    }

    createRoom(hostSocketId) {
        const code = this.generateRoomCode();
        if (this.rooms[code]) return this.createRoom(hostSocketId);

        this.rooms[code] = {
            code,
            hostId: hostSocketId,
            players: {},
            gameState: 'LOBBY',
            currentQuestion: null,
            answers: [], // Array of { playerId, text }
            usedQuestions: [],
            round: 0,
            maxRounds: 5,
            isPremium: false // Placeholder for monetization
        };

        console.log(`Room created: ${code} by Host ${hostSocketId}`);
        return code;
    }

    joinRoom(socketId, roomCode, nickname) {
        const room = this.rooms[roomCode];
        if (!room) return { error: 'Sala não encontrada' };
        if (room.gameState !== 'LOBBY') return { error: 'Jogo já começou' };

        // Simple duplicate name check
        const nameUsed = Object.values(room.players).some(p => p.name.toLowerCase() === nickname.toLowerCase());
        if (nameUsed) return { error: 'Nome já em uso' };

        room.players[socketId] = {
            id: socketId,
            name: nickname,
            score: 0,
            answer: null,
            isAnswered: false,
            hasPinkCow: false
        };

        console.log(`Player ${nickname} joined room ${roomCode}`);
        return { success: true, room };
    }

    handleDisconnect(socketId) {
        for (const [code, room] of Object.entries(this.rooms)) {
            if (room.hostId === socketId) {
                console.log(`Host disconnected. Destroying room ${code}`);
                this.io.to(code).emit('room_destroyed');
                delete this.rooms[code];
                return;
            }
            if (room.players[socketId]) {
                const player = room.players[socketId];
                console.log(`Player ${player.name} left room ${code}`);
                delete room.players[socketId];
                this.io.to(room.hostId).emit('update_players', room.players); // Correct event for simple leave
                // If everyone left, maybe destroy room? 
            }
        }
    }

    startGame(roomCode) {
        const room = this.rooms[roomCode];
        if (!room) return;

        room.round = 0;
        room.usedQuestions = [];
        this.nextRound(roomCode);
    }

    nextRound(roomCode) {
        const room = this.rooms[roomCode];
        if (!room) return;

        if (room.round >= room.maxRounds) {
            // Game Over
            room.gameState = 'SCOREBOARD';
            this.io.to(roomCode).emit('game_state_update', {
                state: 'SCOREBOARD',
                players: room.players
            });
            return;
        }

        room.round++;
        room.gameState = 'QUESTION';

        // Pick random question not used
        const availableQuestions = questions.filter(q => !room.usedQuestions.includes(q.id));
        if (availableQuestions.length === 0) {
            // Should not happen with enough questions, but loop restart if needed
            room.usedQuestions = [];
        }

        const randomQ = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        room.currentQuestion = randomQ;
        room.usedQuestions.push(randomQ.id);
        room.answers = [];

        // Reset player answers
        Object.values(room.players).forEach(p => {
            p.answer = null;
            p.isAnswered = false;
        });

        // Notify everyone
        this.io.to(roomCode).emit('game_state_update', {
            state: 'QUESTION',
            question: room.currentQuestion,
            round: room.round,
            totalRounds: room.maxRounds
        });

        // Auto move to input after 5 seconds
        setTimeout(() => {
            if (this.rooms[roomCode]) { // Check if room still exists
                this.startInputPhase(roomCode);
            }
        }, 5000);
    }

    startInputPhase(roomCode) {
        const room = this.rooms[roomCode];
        if (!room) return;

        room.gameState = 'ANSWER_INPUT';
        const duration = 30; // seconds

        this.io.to(roomCode).emit('game_state_update', {
            state: 'ANSWER_INPUT',
            timer: duration
        });

        // Start timer logic on server or trust client timer? 
        // Better: Server timer that forces next phase.
        setTimeout(() => {
            if (this.rooms[roomCode] && room.gameState === 'ANSWER_INPUT') {
                this.calculateResults(roomCode);
            }
        }, duration * 1000);
    }

    submitAnswer(roomCode, socketId, answerText) {
        const room = this.rooms[roomCode];
        if (!room || room.gameState !== 'ANSWER_INPUT') return;

        const player = room.players[socketId];
        if (player && !player.isAnswered) {
            player.answer = answerText;
            player.isAnswered = true;

            // Notify Host that someone answered (without revealing what)
            this.io.to(room.hostId).emit('player_answered', { playerId: socketId });

            // Send confirmation to player
            this.io.to(socketId).emit('answer_received');

            // Check if everyone answered
            const allAnswered = Object.values(room.players).every(p => p.isAnswered);
            if (allAnswered) {
                // Short delay before reveal
                setTimeout(() => this.calculateResults(roomCode), 1000);
            }
        }
    }

    calculateResults(roomCode) {
        const room = this.rooms[roomCode];
        if (!room) return;
        if (room.gameState !== 'ANSWER_INPUT') return; // Already processed

        room.gameState = 'GROUPING'; // Internal state before reveal

        const players = Object.values(room.players);
        const answers = players.filter(p => p.answer).map(p => ({
            playerId: p.id,
            text: p.answer,
            normalized: this.normalizeText(p.answer)
        }));

        // Grouping Logic
        const groups = []; // [{ text: 'Batata', count: 2, players: [id1, id2] }]

        answers.forEach(ans => {
            // Try to find existing group
            let match = null;

            for (const group of groups) {
                if (this.isSimilar(ans.normalized, group.normalized)) {
                    match = group;
                    break;
                }
            }

            if (match) {
                match.players.push(ans.playerId);
                match.count++;
            } else {
                groups.push({
                    text: ans.text, // Display text from first answer
                    normalized: ans.normalized,
                    count: 1,
                    players: [ans.playerId]
                });
            }
        });

        // Scoring
        // If unique (count 1) -> 0 pts
        // If count > 1 -> count pts for each member
        // Double points if EVERYONE matched (Hive Mind) - Bonus

        const isMindMeld = (groups.length === 1 && players.length > 2);

        // Find who gave unique answers
        const uniqueAnswerPlayers = [];

        groups.forEach(group => {
            let points = group.count === 1 ? 0 : group.count;
            if (isMindMeld) points *= 2;

            group.points = points;

            group.players.forEach(pid => {
                if (room.players[pid]) {
                    room.players[pid].score += points;
                }
            });

            if (group.count === 1) {
                uniqueAnswerPlayers.push(...group.players);
            }
        });

        // Pink Cow Logic (Vaca Rosa)
        // If EXACTLY ONE player gave a unique answer, they get the cow.
        if (uniqueAnswerPlayers.length === 1) {
            const newCowOwnerId = uniqueAnswerPlayers[0];

            // Remove cow from everyone else
            Object.values(room.players).forEach(p => p.hasPinkCow = false);

            // Give to new owner
            if (room.players[newCowOwnerId]) {
                room.players[newCowOwnerId].hasPinkCow = true;
            }
        }

        // Sort groups by size (descending)
        groups.sort((a, b) => b.count - a.count);

        room.gameState = 'REVEAL';
        this.io.to(roomCode).emit('game_state_update', {
            state: 'REVEAL',
            groups: groups,
            players: room.players // Send full player list with updated scores
        });

        // Wait on Reveal screen before going to Scoreboard or Next Round
        // Host will trigger next manually or timer? 
        // Let's do timer for MVP flow
        setTimeout(() => {
            this.nextRound(roomCode);
        }, 10000);
    }

    normalizeText(text) {
        return text.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
            .trim();
    }

    isSimilar(t1, t2) {
        if (t1 === t2) return true;
        // Edit distance check for short words, or string similarity for longer
        // Basic Levenshtein via string-similarity is overkill but easy
        const similarity = stringSimilarity.compareTwoStrings(t1, t2);
        return similarity > 0.8; // 80% similarity threshold
    }

    generateRoomCode() {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let result = "";
        do { // Ensure unique code loop
            result = "";
            for (let i = 0; i < 4; i++) {
                result += letters.charAt(Math.floor(Math.random() * letters.length));
            }
        } while (this.rooms[result]);
        return result;
    }
}

module.exports = GameManager;
