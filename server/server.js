const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const GameManager = require('./gameManager');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["https://mente-coletiva.vercel.app", "http://localhost:5173", "http://127.0.0.1:5173"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = process.env.PORT || 3000;
const gameManager = new GameManager(io);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create_room', (callback) => {
        const roomCode = gameManager.createRoom(socket.id);
        socket.join(roomCode);
        if (typeof callback === 'function') callback({ success: true, roomCode });
    });

    socket.on('join_room', ({ roomCode, nickname }, callback) => {
        const code = roomCode.toUpperCase();
        const result = gameManager.joinRoom(socket.id, code, nickname);

        if (result.success) {
            socket.join(code);
            io.to(code).emit('update_players', result.room.players);
            // Send current game state to player who joined late (or reconnected)
            socket.emit('game_state_update', {
                state: result.room.gameState,
                question: result.room.currentQuestion,
                round: result.room.round
            });
            if (typeof callback === 'function') callback({ success: true, room: result.room });
        } else {
            if (typeof callback === 'function') callback(result);
        }
    });

    socket.on('start_game', ({ roomCode }) => {
        // Verify host?
        gameManager.startGame(roomCode.toUpperCase());
    });

    socket.on('update_settings', ({ roomCode, settings }) => {
        gameManager.updateSettings(roomCode.toUpperCase(), settings);
    });

    socket.on('submit_answer', ({ roomCode, answer }) => {
        gameManager.submitAnswer(roomCode.toUpperCase(), socket.id, answer);
    });

    socket.on('disconnect', () => {
        gameManager.handleDisconnect(socket.id);
    });

    socket.on('play_again', ({ roomCode }) => {
        gameManager.resetGame(roomCode.toUpperCase());
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
