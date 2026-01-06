import React, { useEffect, useState } from 'react';
import socket from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';

function Host() {
    const [roomCode, setRoomCode] = useState(null);
    const [players, setPlayers] = useState({});
    const [gameState, setGameState] = useState('LOADING');
    const [question, setQuestion] = useState(null);
    const [timer, setTimer] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [round, setRound] = useState(0);

    // Host-Player State
    const [isHostPlayer, setIsHostPlayer] = useState(false);
    const [hostNickname, setHostNickname] = useState('');
    const [hostAnswer, setHostAnswer] = useState('');
    const [hostSubmitted, setHostSubmitted] = useState(false);
    const [showHostInput, setShowHostInput] = useState(false); // Toggle for input UI

    // Settings State
    const [settings, setSettings] = useState({
        timerDuration: 30,
        questionDeck: 'classic',
        winCondition: 'rounds',
        winValue: 10
    });
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        socket.connect();

        socket.emit('create_room', ({ success, roomCode }) => {
            if (success) {
                setRoomCode(roomCode);
                setGameState('LOBBY');
            }
        });

        socket.on('update_players', (newPlayers) => setPlayers(newPlayers));
        socket.on('player_answered', ({ playerId }) => {
            setPlayers(prev => ({
                ...prev,
                [playerId]: { ...prev[playerId], isAnswered: true }
            }));
        });

        socket.on('game_state_update', (data) => {
            setGameState(data.state);
            if (data.question) {
                setQuestion(data.question);
                setHostSubmitted(false);
                setHostAnswer('');
            }
            if (data.timer) setTimer(data.timer);
            if (data.groups) setAnswers(data.groups);
            if (data.players) setPlayers(data.players);
            if (data.round) setRound(data.round);
        });

        socket.on('answer_received', () => {
            if (isHostPlayer) setHostSubmitted(true);
        });

        return () => {
            socket.off('update_players');
            socket.off('game_state_update');
            socket.off('player_answered');
            socket.off('answer_received');
            socket.disconnect();
        };
    }, [isHostPlayer]);

    const startGame = () => {
        socket.emit('update_settings', { roomCode, settings }); // Ensure settings are synced before start
        socket.emit('start_game', { roomCode });
    };

    const joinAsHost = () => {
        if (!hostNickname.trim()) return;
        socket.emit('join_room', { roomCode, nickname: hostNickname }, (res) => {
            if (res.success) {
                setIsHostPlayer(true);
                setShowHostInput(false);
            } else {
                alert(res.error);
            }
        });
    };

    const submitHostAnswer = () => {
        if (!hostAnswer.trim()) return;
        socket.emit('submit_answer', { roomCode, answer: hostAnswer });
    };

    // --- Render States ---
    const renderLobby = () => (
        <div className="flex flex-col items-center gap-8 w-full max-w-6xl px-4">
            <header className="flex flex-col items-center text-center">
                <h2 className="text-xl md:text-3xl uppercase font-bold text-pink-300 tracking-[0.2em] mb-4">Join at game.com/play</h2>
                <div className="bg-white text-black p-6 md:p-10 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.5)] transform hover:scale-105 transition duration-500">
                    <h2 className="text-sm md:text-xl text-center uppercase font-bold text-gray-500 mb-2">Room Code</h2>
                    <h1 className="text-6xl md:text-9xl font-black tracking-widest leading-none">{roomCode}</h1>
                </div>
            </header>

            {/* Host Player Join UI */}
            {!isHostPlayer && (
                <div className="flex flex-col md:flex-row gap-2 items-center bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <input
                        value={hostNickname}
                        onChange={e => setHostNickname(e.target.value)}
                        className="bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        placeholder="Host Name"
                    />
                    <button onClick={joinAsHost} className="px-6 py-2 bg-purple-600 rounded-lg font-bold hover:bg-purple-700">
                        Play too!
                    </button>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 w-full">
                <AnimatePresence>
                    {Object.values(players).map(p => (
                        <motion.div
                            initial={{ scale: 0, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            key={p.id}
                            className="bg-gradient-to-br from-purple-600 to-indigo-700 p-4 md:p-6 rounded-2xl text-center shadow-lg border-2 border-purple-400 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-full bg-white opacity-10 rounded-2xl"></div>
                            <div className="text-3xl md:text-4xl mb-2">{p.hasPinkCow ? '🐮' : '👾'}</div>
                            <h3 className="font-bold text-lg md:text-xl text-white truncate">{p.name}</h3>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {Object.keys(players).length > 0 && (
                    <motion.button
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        onClick={startGame}
                        className="mt-8 px-10 md:px-16 py-4 md:py-6 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-black text-2xl md:text-4xl rounded-full shadow-[0_0_30px_rgba(74,222,128,0.6)] transform hover:scale-110 transition active:scale-95"
                    >
                        START GAME
                    </motion.button>
                )}
            </AnimatePresence>

            {/* SETTINGS BUTTON */}
            <button
                onClick={() => setShowSettings(true)}
                className="absolute top-6 right-6 p-4 bg-gray-800 rounded-full hover:bg-gray-700 transition"
            >
                <span className="text-2xl">⚙️</span>
            </button>

            {/* SETTINGS MODAL */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border-2 border-purple-500 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6">
                        <h2 className="text-3xl font-black text-white text-center mb-4">GAME SETTINGS</h2>

                        {/* Timer */}
                        <div className="space-y-2">
                            <label className="text-gray-400 font-bold uppercase tracking-wider">Timer: {settings.timerDuration}s</label>
                            <input
                                type="range" min="10" max="120" step="5"
                                value={settings.timerDuration}
                                onChange={e => setSettings({ ...settings, timerDuration: Number(e.target.value) })}
                                className="w-full accent-purple-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>


                        {/* Deck Selection */}
                        <div className="space-y-2">
                            <label className="text-gray-400 font-bold uppercase tracking-wider">Question Decks</label>

                            <div className="flex gap-2 mb-2">
                                <button
                                    onClick={() => setSettings({ ...settings, questionDeck: 'all' })}
                                    className={`px-3 py-1 rounded-full text-sm font-bold border transition ${settings.questionDeck === 'all' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
                                >
                                    Mix All 🎲
                                </button>
                                <button
                                    onClick={() => setSettings({ ...settings, questionDeck: ['classic'] })}
                                    className="px-3 py-1 rounded-full text-sm font-bold border bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700"
                                >
                                    Reset
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-800 rounded-xl border border-gray-700">
                                {DECK_OPTIONS.map(opt => {
                                    const isSelected = settings.questionDeck === 'all' || (Array.isArray(settings.questionDeck) && settings.questionDeck.includes(opt.id)) || settings.questionDeck === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => settings.questionDeck !== 'all' && toggleDeck(opt.id)}
                                            disabled={settings.questionDeck === 'all'}
                                            className={`text-left px-3 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${isSelected ? 'bg-purple-900 text-purple-200' : 'hover:bg-gray-700 text-gray-400'} ${settings.questionDeck === 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-500'}`}></div>
                                            {opt.label}
                                        </button>
                                    )
                                })}
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

                        <button
                            onClick={() => setShowSettings(false)}
                            className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-xl uppercase tracking-widest transition mt-4"
                        >
                            Save & Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderQuestion = () => (
        <div className="text-center max-w-5xl w-full flex flex-col justify-center h-full px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 md:mb-12">
                <span className="px-6 py-2 bg-purple-900 rounded-full text-purple-300 font-bold uppercase tracking-widest text-sm md:text-lg border border-purple-700">
                    Round {round}
                </span>
            </motion.div>
            <motion.h1
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="text-4xl md:text-7xl lg:text-8xl font-black leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-lg"
            >
                {question?.text}
            </motion.h1>
        </div>
    );

    const renderInput = () => (
        <div className="text-center max-w-6xl w-full h-full flex flex-col justify-between py-8 md:py-12 px-4">
            <div>
                {isHostPlayer && !hostSubmitted ? (
                    <div className="flex flex-col items-center gap-4 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h2 className="text-xl text-purple-300 font-bold uppercase tracking-widest">Your Answer</h2>
                        <div className="w-full max-w-2xl flex gap-2">
                            <input
                                value={hostAnswer}
                                onChange={e => setHostAnswer(e.target.value)}
                                className="flex-1 bg-gray-800 border-2 border-purple-500 rounded-xl px-6 py-4 text-2xl text-white placeholder-gray-500 focus:outline-none focus:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition"
                                placeholder="Type here..."
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && submitHostAnswer()}
                            />
                            <button
                                onClick={submitHostAnswer}
                                className="bg-green-500 hover:bg-green-600 text-white px-8 rounded-xl font-black uppercase text-xl transition transform active:scale-95"
                            >
                                SEND
                            </button>
                        </div>
                    </div>
                ) : (
                    <h2 className="text-xl md:text-3xl text-pink-400 font-bold uppercase tracking-widest mb-4 md:mb-8 animate-pulse">
                        {isHostPlayer && hostSubmitted ? "Answer Sent! Waiting for others..." : "Typing..."}
                    </h2>
                )}
                <h1 className="text-3xl md:text-6xl font-bold opacity-90 leading-tight">{question?.text}</h1>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 max-h-[40vh] overflow-y-auto p-2">
                {Object.values(players).map(p => (
                    <motion.div
                        animate={{ scale: p.isAnswered ? 1.05 : 1 }}
                        key={p.id}
                        className={`p-3 md:p-4 rounded-xl text-center font-bold text-base md:text-xl border-4 transition-all duration-300 ${p.isAnswered ? 'bg-green-500 border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.5)] text-white' : 'bg-gray-800 border-gray-700 text-gray-500'}`}
                    >
                        {p.name}
                    </motion.div>
                ))}
            </div>

            <div className="w-full h-4 md:h-6 bg-gray-800 rounded-full overflow-hidden border border-gray-700 shadow-inner">
                <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 30, ease: "linear" }} // Should sync with server timer ideally
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-600"
                />
            </div>
        </div>
    );

    const renderReveal = () => (
        <div className="w-full max-w-5xl flex flex-col h-full py-8 px-4">
            <h1 className="text-3xl md:text-5xl font-black text-center mb-8 md:mb-12 uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                The Results
            </h1>
            <div className="space-y-4 flex-1 overflow-y-auto px-2 md:px-4 hide-scrollbar">
                {answers.map((group, idx) => (
                    <motion.div
                        initial={{ opacity: 0, x: -100, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ delay: idx * 0.8, type: "spring" }}
                        key={idx}
                        className="flex items-center justify-between bg-gray-800 bg-opacity-80 backdrop-blur-sm p-4 md:p-6 rounded-3xl border border-gray-700 shadow-2xl"
                    >
                        <div className="flex flex-col gap-2">
                            <h2 className="text-2xl md:text-5xl font-black text-white capitalize">{group.text}</h2>
                            <div className="flex flex-wrap gap-2">
                                {group.players.map(pid => (
                                    <span key={pid} className="text-sm md:text-lg bg-indigo-900 text-indigo-200 px-2 md:px-3 py-1 rounded-lg font-bold">
                                        {players[pid]?.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col items-center min-w-[60px] md:min-w-[100px]">
                            <span className={`block text-3xl md:text-6xl font-black ${group.players.length > 1 ? 'text-green-400' : 'text-pink-500'}`}>
                                {group.count}
                            </span>
                            <span className="text-[10px] md:text-xs uppercase font-bold text-gray-400 tracking-wider">Points</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const renderScoreboard = () => {
        const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);
        return (
            <div className="w-full max-w-3xl text-center h-full py-8 md:py-12 flex flex-col px-4">
                <h1 className="text-5xl md:text-7xl font-black mb-8 md:mb-16 text-yellow-400 drop-shadow-md">LEADERBOARD</h1>
                <div className="space-y-3 md:space-y-4 overflow-y-auto flex-1 px-2 md:px-4">
                    {sortedPlayers.map((p, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.2 }}
                            key={p.id}
                            className={`flex justify-between items-center p-4 md:p-6 rounded-2xl border-2 shadow-xl ${idx === 0 ? 'bg-yellow-900 border-yellow-500 bg-opacity-40' : 'bg-gray-800 border-gray-700'}`}
                        >
                            <div className="flex items-center gap-4 md:gap-6">
                                <span className={`text-3xl md:text-5xl font-black ${idx === 0 ? 'text-yellow-400' : 'text-gray-600'}`}>
                                    #{idx + 1}
                                </span>
                                <span className="text-2xl md:text-4xl font-bold text-white">
                                    {p.name} {p.hasPinkCow && '🐮'}
                                </span>
                            </div>
                            <span className="text-3xl md:text-5xl font-black text-green-400">{p.score}</span>
                        </motion.div>
                    ))}
                </div>


                <button
                    onClick={() => socket.emit('play_again', { roomCode })}
                    className="mx-auto mt-8 px-12 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-black text-2xl rounded-full shadow-xl transform hover:scale-105 transition"
                >
                    PLAY AGAIN 🔄
                </button>
            </div >
        )
    }


    // Available Decks
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

    return (
        <div className="min-h-screen bg-[#1a1b26] text-white flex flex-col items-center justify-center p-4 lg:p-12 overflow-hidden relative font-sans">

            <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900 via-gray-900 to-black opacity-50"></div>

            {/* HOST PLAYER OVERLAY */}
            {isHostPlayer && gameState === 'ANSWER_INPUT' && !hostSubmitted && (
                <motion.div
                    initial={{ y: 100 }} animate={{ y: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t-2 border-purple-500 p-4 shadow-2xl flex gap-2 items-center justify-center"
                >
                    <input
                        value={hostAnswer}
                        onChange={e => setHostAnswer(e.target.value)}
                        placeholder="Your Answer..."
                        className="w-full max-w-md bg-gray-800 text-white rounded-xl px-4 py-3 text-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                    />
                    <button
                        onClick={submitHostAnswer}
                        className="bg-green-500 text-white p-3 rounded-xl font-bold hover:bg-green-600 shadow-lg"
                    >
                        SEND
                    </button>
                </motion.div>
            )}

            <div className="z-10 w-full h-full flex flex-col items-center">
                {gameState === 'LOADING' && <div className="text-xl md:text-2xl font-mono animate-pulse">Initializing Neural Link...</div>}
                {gameState === 'LOBBY' && renderLobby()}
                {gameState === 'QUESTION' && renderQuestion()}
                {gameState === 'ANSWER_INPUT' && renderInput()}
                {(gameState === 'GROUPING' || gameState === 'REVEAL') && renderReveal()}
                {gameState === 'SCOREBOARD' && renderScoreboard()}
            </div>
        </div >
    );
}

export default Host;
