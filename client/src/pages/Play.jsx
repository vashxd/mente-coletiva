import React, { useEffect, useState, useRef } from 'react';
import socket from '../services/socket';
import AdSpace from '../components/AdSpace';
import QuestionView from '../components/Game/QuestionView';
import RevealView from '../components/Game/RevealView';
import ScoreboardView from '../components/Game/ScoreboardView';

function Play() {
    const [step, setStep] = useState('LOGIN');
    const [nickname, setNickname] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [gameState, setGameState] = useState('LOBBY');
    const [question, setQuestion] = useState(null);
    const [answer, setAnswer] = useState('');
    const [hasAnswered, setHasAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [players, setPlayers] = useState({});
    const [answers, setAnswers] = useState([]); // Grouped answers from server

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

        socket.on('game_state_update', (data) => {
            console.log("RECEIVED STATE UPDATE:", data);
            setGameState(data.state);
            if (data.state === 'QUESTION') {
                setHasAnswered(false);
                setAnswer('');
            }
            if (data.question) setQuestion(data.question);
            if (data.groups) setAnswers(data.groups);
            if (data.players) {
                setPlayers(data.players);
                // Update personal score
                const me = Object.values(data.players).find(p => p.id === socket.id);
                if (me) {
                    setScore(me.score);
                    if (me.isAnswered !== undefined) setHasAnswered(me.isAnswered);
                }
            }
        });

        socket.on('answer_received', () => {
            setHasAnswered(true);
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


    // --- Render Unified Game View ---

    // LOGIN / JOIN
    if (step === 'LOGIN') {
        return (
            <div className="flex flex-col h-screen bg-[#1a1b26] p-6 items-center justify-center text-white safe-area-inset overflow-hidden relative">
                <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900 via-gray-900 to-black opacity-50"></div>
                <div className="z-10 mb-12 text-center">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">MENTE COLETIVA</h1>
                    <p className="text-gray-400">Think like everyone else.</p>
                </div>

                <div className="z-10 w-full max-w-sm space-y-4">
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

    // MAIN GAME CONTAINER
    return (
        <div className="flex flex-col h-screen bg-[#1a1b26] text-white">
            <Header />
            <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900 via-gray-900 to-black opacity-50"></div>

                {/* Content Layer */}
                <div className="z-10 w-full h-full flex flex-col items-center justify-center">
                    {gameState === 'LOBBY' && (
                        <div className="text-center">
                            <div className="text-8xl mb-8 animate-bounce">👋</div>
                            <h1 className="text-3xl font-bold mb-4">You're in!</h1>
                            <p className="text-gray-400">Waiting for Host to start...</p>
                        </div>
                    )}

                    {gameState === 'QUESTION' && (
                        <div className="flex-1 flex flex-col justify-center text-center">
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Look up!</h2>
                            <p className="text-4xl md:text-6xl font-black leading-tight animate-in fade-in zoom-in duration-500">{question?.text}</p>
                        </div>
                    )}

                    {gameState === 'ANSWER_INPUT' && (
                        <QuestionView
                            question={question}
                            round={0} // Server doesn't send round to players yet? Need to check.
                            players={players || {}}
                            myAnswer={answer}
                            setMyAnswer={setAnswer}
                            onSubmit={submitAnswer}
                            hasSubmitted={hasAnswered}
                            timer={30}
                        />
                    )}

                    {(gameState === 'GROUPING' || gameState === 'REVEAL') && (
                        <RevealView answers={answers || []} players={players || {}} />
                    )}

                    {gameState === 'SCOREBOARD' && (
                        <ScoreboardView players={players || {}} isHost={false} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default Play;
