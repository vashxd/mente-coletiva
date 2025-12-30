import React, { useEffect, useState, useRef } from 'react';
import socket from '../services/socket';
import AdSpace from '../components/AdSpace';

function Play() {
    const [step, setStep] = useState('LOGIN');
    const [nickname, setNickname] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [gameState, setGameState] = useState('LOBBY');
    const [question, setQuestion] = useState(null);
    const [answer, setAnswer] = useState('');
    const [hasAnswered, setHasAnswered] = useState(false);
    const [score, setScore] = useState(0);

    const wakeLock = useRef(null);

    useEffect(() => {
        socket.connect();
        socket.on('disconnect', (reason) => {
            console.log('Socket Disconnected:', reason);
            // Don't go to login immediately if it might be temporary
            if (reason === 'io server disconnect' || reason === 'io client disconnect') {
                setStep('LOGIN');
            }
        });

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('App Foregrounded. Checking connection...');
                if (!socket.connected) {
                    socket.connect();
                }
                // Try to rejoin if we have credentials
                if (roomCode && nickname) {
                    socket.emit('join_room', { roomCode, nickname }, (res) => {
                        if (!res.success) console.warn("Background Rejoin Failed:", res.error);
                        else console.log("Background Rejoin Success");
                    });
                }
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            socket.off('game_state_update');
            socket.off('answer_received');
            socket.off('disconnect');
            releaseWakeLock();
        };
    }, [roomCode, nickname]); // Dep dependency added so rejoin works

    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLock.current = await navigator.wakeLock.request('screen');
            }
        } catch (err) { }
    };

    const releaseWakeLock = async () => {
        if (wakeLock.current) {
            await wakeLock.current.release();
            wakeLock.current = null;
        }
    }

    const joinRoom = () => {
        if (!nickname || !roomCode) return;
        socket.emit('join_room', { roomCode, nickname }, (res) => {
            if (res.success) {
                setStep('LOBBY');
                requestWakeLock();
            } else {
                alert(res.error);
            }
        });
    };

    const submitAnswer = () => {
        if (!answer.trim()) return;
        socket.emit('submit_answer', { roomCode: roomCode.toUpperCase(), answer });
    };

    // --- Render Steps ---

    if (step === 'LOGIN') {
        return (
            <div className="flex flex-col h-screen bg-gray-950 p-6 items-center justify-center text-white safe-area-inset">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">MENTE COLETIVA</h1>
                    <p className="text-gray-400">Think like everyone else.</p>
                </div>

                <div className="w-full max-w-sm space-y-4">
                    <input
                        className="w-full p-6 bg-gray-900 rounded-2xl border-2 border-gray-800 text-white text-xl placeholder-gray-600 focus:border-purple-500 focus:outline-none transition"
                        placeholder="YOUR NAME"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                    />
                    <input
                        className="w-full p-6 bg-gray-900 rounded-2xl border-2 border-gray-800 text-white text-xl placeholder-gray-600 uppercase focus:border-purple-500 focus:outline-none transition tracking-widest text-center"
                        placeholder="CODE"
                        maxLength={4}
                        value={roomCode}
                        onChange={e => setRoomCode(e.target.value.toUpperCase())}
                    />
                    <button
                        onClick={joinRoom}
                        className="w-full py-6 bg-purple-600 hover:bg-purple-700 rounded-2xl font-black text-2xl shadow-lg active:scale-95 transition mt-8"
                    >
                        JOIN GAME
                    </button>
                </div>
            </div>
        );
    }

    // HEADER for all game states
    const Header = () => (
        <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-800">
            <div className="font-bold text-gray-400">{nickname}</div>
            <div className="px-3 py-1 bg-gray-800 rounded-lg text-green-400 font-bold">{score} PTS</div>
        </div>
    );

    // LOBBY
    if (gameState === 'LOBBY' && step !== 'LOGIN') {
        return (
            <div className="flex flex-col h-screen bg-gray-950 text-white">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-950">
                    <div className="text-8xl mb-8 animate-bounce">👋</div>
                    <h1 className="text-3xl font-bold mb-4">You're in!</h1>
                    <p className="text-gray-400">Watch the big screen.</p>
                </div>
            </div>
        )
    }

    // INPUT
    if (gameState === 'ANSWER_INPUT' && !hasAnswered) {
        return (
            <div className="flex flex-col h-screen bg-gray-950 text-white">
                <Header />
                <div className="flex-1 flex flex-col p-6">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Question</h2>
                    <div className="flex-1 overflow-y-auto mb-4">
                        <p className="text-2xl font-bold leading-snug">{question?.text}</p>
                    </div>

                    <textarea
                        className="w-full p-4 bg-gray-800 rounded-2xl border-2 border-purple-500 text-white text-xl h-40 mb-4 focus:outline-none focus:bg-gray-700"
                        placeholder="Type your answer..."
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                    />
                    <button
                        onClick={submitAnswer}
                        className="w-full py-6 bg-green-500 active:bg-green-600 rounded-2xl font-black text-2xl shadow-lg transition transform active:scale-95"
                    >
                        SEND
                    </button>
                </div>
            </div>
        )
    }

    // WAITING / ADS
    return (
        <div className="flex flex-col h-screen bg-gray-950 text-white">
            <Header />
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                {hasAnswered && gameState === 'ANSWER_INPUT' ? (
                    <>
                        <h1 className="text-4xl font-black text-green-500 mb-2">Sent!</h1>
                        <p className="text-gray-400 mb-8">Relax while others panic.</p>
                        <AdSpace />
                    </>
                ) : (
                    <>
                        {gameState === 'QUESTION' && <div className="text-2xl font-bold animate-pulse">Eyes on the TV! 👀</div>}
                        {(gameState === 'REVEAL' || gameState === 'GROUPING') && (
                            <div>
                                <div className="text-2xl font-bold mb-4">Results Time!</div>
                                <AdSpace />
                            </div>
                        )}
                        {gameState === 'SCOREBOARD' && <div className="text-3xl font-bold text-yellow-400">Check the Ranking! 🏆</div>}
                    </>
                )}
            </div>
        </div>
    );
}

export default Play;
