import React, { useEffect, useState } from 'react';
import socket from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionView from '../components/Game/QuestionView';
import RevealView from '../components/Game/RevealView';
import ScoreboardView from '../components/Game/ScoreboardView';

function Host() {
    const [step, setStep] = useState('SETUP'); // SETUP, GAME
    const [roomCode, setRoomCode] = useState(null);
    const [players, setPlayers] = useState({});
    const [gameState, setGameState] = useState('LOADING');
    const [question, setQuestion] = useState(null);
    const [timer, setTimer] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [round, setRound] = useState(0);

    // Host Player State
    const [nickname, setNickname] = useState('');
    const [myAnswer, setMyAnswer] = useState('');
    const [hasAnswered, setHasAnswered] = useState(false);

    // Settings State
    const [settings, setSettings] = useState({
        timerDuration: 30,
        questionDeck: 'classic',
        winCondition: 'rounds',
        winValue: 10
    });
    const [showSettings, setShowSettings] = useState(false);

    // Initial Socket Setup
    useEffect(() => {
        socket.connect();

        socket.on('update_players', (newPlayers) => setPlayers(newPlayers));
        socket.on('player_answered', ({ playerId }) => {
            setPlayers(prev => ({
                ...prev,
                [playerId]: { ...prev[playerId], isAnswered: true }
            }));
        });

        socket.on('game_state_update', (data) => {
            setGameState(data.state);
            setStep('GAME'); // Ensure we are in game view

            if (data.state === 'QUESTION') {
                setHasAnswered(false);
                setMyAnswer('');
            }
            if (data.question) setQuestion(data.question);
            if (data.timer) setTimer(data.timer);
            if (data.groups) setAnswers(data.groups);
            if (data.players) setPlayers(data.players);
            if (data.round) setRound(data.round);
        });

        socket.on('answer_received', () => {
            // If *I* answered, this confirms it (though Play.jsx sets it optimistically/via state update)
            // We can check if the confirmed answer ID matches ours if needed, 
            // but usually 'game_state_update' handles the bulk. 
            // For safety w/ async, we rely on local 'hasAnswered' state toggled by submit.
        });

        return () => {
            socket.off('update_players');
            socket.off('game_state_update');
            socket.off('player_answered');
            socket.off('answer_received');
            socket.disconnect();
        };
    }, []);

    const createAndJoin = () => {
        if (!nickname) return alert("Enter a name!");

        socket.emit('create_room', ({ success, roomCode: code }) => {
            if (success) {
                setRoomCode(code);
                // Immediately join as player
                socket.emit('join_room', { roomCode: code, nickname }, (res) => {
                    if (res.success) {
                        setStep('GAME');
                        setGameState('LOBBY');
                    } else {
                        alert("Error joining own room: " + res.error);
                    }
                });
            }
        });
    };

    const startGame = () => {
        socket.emit('update_settings', { roomCode, settings });
        socket.emit('start_game', { roomCode });
    };

    const submitAnswer = () => {
        if (!myAnswer.trim()) return;
        socket.emit('submit_answer', { roomCode, answer: myAnswer });
        setHasAnswered(true);
    };

    // --- DECK SETTINGS CONSTANTS ---
    const DECK_OPTIONS = [
        { id: 'classic', label: 'Classic' },
        { id: 'polemic', label: 'Polemic' },
        { id: 'deep', label: 'Deep' },
        { id: 'technology', label: 'Technology' },
        { id: 'relationships', label: 'Relationships' },
        { id: 'nostalgia', label: 'Nostalgia' },
        { id: 'embarrassing', label: 'Vergonha' },
        { id: 'travel', label: 'Travel' },
        { id: 'money', label: 'Money' },
        { id: 'party', label: 'Party' },
        { id: 'cinema', label: 'Cinema' },
        { id: 'comics', label: 'Comics' },
        { id: 'popculture', label: 'Pop Culture' }
    ];

    const toggleDeck = (deckId) => {
        let current = settings.questionDeck;
        if (current === 'all') current = [];
        if (typeof current === 'string') current = [current];

        if (current.includes(deckId)) {
            const newVal = current.filter(d => d !== deckId);
            setSettings({ ...settings, questionDeck: newVal.length ? newVal : 'classic' });
        } else {
            setSettings({ ...settings, questionDeck: [...current, deckId] });
        }
    };

    // --- RENDERERS ---

    if (step === 'SETUP') {
        return (
            <div className="flex flex-col h-screen bg-[#1a1b26] p-6 items-center justify-center text-white safe-area-inset overflow-hidden relative">
                <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900 via-gray-900 to-black opacity-50"></div>
                <div className="z-10 mb-12 text-center">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">HOST GAME</h1>
                    <p className="text-gray-400">Create a room and play!</p>
                </div>

                <div className="z-10 w-full max-w-sm space-y-4">
                    <input
                        className="w-full p-6 bg-gray-900 rounded-2xl border-2 border-gray-800 text-white text-xl placeholder-gray-600 focus:border-purple-500 focus:outline-none transition text-center"
                        placeholder="YOUR NAME"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                    />
                    <button
                        onClick={createAndJoin}
                        className="w-full py-6 bg-pink-600 hover:bg-pink-700 rounded-2xl font-black text-2xl shadow-lg active:scale-95 transition mt-8"
                    >
                        CREATE ROOM
                    </button>
                </div>
            </div>
        );
    }

    // GAME VIEW (Unified)
    return (
        <div className="flex flex-col h-screen bg-[#1a1b26] text-white">
            {/* ADMIN HEADER */}
            <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-800 z-50">
                <div className="flex items-center gap-4">
                    <div className="font-bold text-gray-400">{nickname} (HOST)</div>
                    <div className="px-3 py-1 bg-gray-800 rounded-lg text-green-400 font-bold">{players[socket.id]?.score || 0} PTS</div>
                    <div className="font-mono text-purple-400 font-black tracking-widest bg-gray-800 px-3 py-1 rounded">CODE: {roomCode}</div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowSettings(true)} className="p-2 bg-gray-800 rounded hover:bg-gray-700">⚙️</button>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900 via-gray-900 to-black opacity-50"></div>

                {/* GAME CONTENT */}
                <div className="z-10 w-full h-full flex flex-col items-center justify-center">

                    {gameState === 'LOBBY' && (
                        <div className="flex flex-col items-center w-full max-w-4xl">
                            <h2 className="text-xl md:text-3xl uppercase font-bold text-pink-300 tracking-[0.2em] mb-8">Waiting for Players...</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full mb-8">
                                <AnimatePresence>
                                    {Object.values(players).map(p => (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            key={p.id}
                                            className="bg-gray-800 p-4 rounded-xl text-center border border-purple-500/30"
                                        >
                                            <div className="text-3xl mb-2">{p.hasPinkCow ? '🐮' : '👾'}</div>
                                            <div className="font-bold truncate">{p.name}</div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* START BUTTON */}
                            <motion.button
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                onClick={startGame}
                                className="px-12 py-6 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-black text-3xl rounded-full shadow-[0_0_30px_rgba(74,222,128,0.6)] transform hover:scale-105 transition"
                            >
                                START GAME
                            </motion.button>
                        </div>
                    )}

                    {gameState === 'QUESTION' && (
                        <div className="flex-1 flex flex-col justify-center text-center">
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Round {round}</h2>
                            <p className="text-4xl md:text-6xl font-black leading-tight animate-in fade-in zoom-in duration-500 px-4">{question?.text}</p>
                            {/* Host could have a 'Skip' button here if stuck? */}
                        </div>
                    )}

                    {gameState === 'ANSWER_INPUT' && (
                        <QuestionView
                            question={question}
                            round={round}
                            players={players || {}}
                            myAnswer={myAnswer}
                            setMyAnswer={setMyAnswer}
                            onSubmit={submitAnswer}
                            hasSubmitted={hasAnswered}
                            timer={timer}
                        />
                    )}

                    {(gameState === 'GROUPING' || gameState === 'REVEAL') && (
                        <RevealView answers={answers || []} players={players || {}} />
                    )}

                    {gameState === 'SCOREBOARD' && (
                        <ScoreboardView
                            players={players || {}}
                            isHost={true} // Shows Play Again button
                            onPlayAgain={() => socket.emit('play_again', { roomCode })}
                        />
                    )}
                </div>
            </div>

            {/* SETTINGS MODAL (Ported from original Host.jsx) */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4 text-left">
                    <div className="bg-gray-900 border-2 border-purple-500 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-3xl font-black text-white text-center mb-4">SETTINGS</h2>
                        {/* Timer */}
                        <div className="space-y-2">
                            <label className="text-gray-400 font-bold uppercase tracking-wider">Timer: {settings.timerDuration}s</label>
                            <input type="range" min="10" max="120" step="5" value={settings.timerDuration} onChange={e => setSettings({ ...settings, timerDuration: Number(e.target.value) })} className="w-full accent-purple-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        {/* Deck Selection (Simplified for brevity in artifact, but keeping logic) */}
                        <div className="space-y-2">
                            <label className="text-gray-400 font-bold uppercase tracking-wider">Decks</label>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setSettings({ ...settings, questionDeck: 'all' })} className={`px-3 py-1 rounded text-xs border ${settings.questionDeck === 'all' ? 'bg-purple-600 border-purple-500' : 'bg-gray-800 border-gray-600'}`}>All</button>
                                {DECK_OPTIONS.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => settings.questionDeck !== 'all' && toggleDeck(opt.id)}
                                        className={`px-3 py-1 rounded text-xs border ${(Array.isArray(settings.questionDeck) && settings.questionDeck.includes(opt.id) || settings.questionDeck === opt.id) ? 'bg-purple-900 border-purple-500' : 'bg-gray-800 border-gray-600'} ${settings.questionDeck === 'all' && 'opacity-50'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Win Condition */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-gray-400 font-bold uppercase tracking-wider">Win Condition</label>
                                <select
                                    value={settings.winCondition}
                                    onChange={e => setSettings({ ...settings, winCondition: e.target.value })}
                                    className="w-full bg-gray-800 text-white border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                                >
                                    <option value="rounds">Rounds Played</option>
                                    <option value="score">Target Score</option>
                                    <option value="time">Time Limit (Mins)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-gray-400 font-bold uppercase tracking-wider">
                                    {settings.winCondition === 'rounds' && 'Max Rounds'}
                                    {settings.winCondition === 'score' && 'Target Score'}
                                    {settings.winCondition === 'time' && 'Minutes'}
                                </label>
                                <input
                                    type="number"
                                    value={settings.winValue}
                                    onChange={e => setSettings({ ...settings, winValue: Number(e.target.value) })}
                                    className="w-full bg-gray-800 text-white border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <button onClick={() => setShowSettings(false)} className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold uppercase">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Host;
