import React from 'react';
import { motion } from 'framer-motion';

const ScoreboardView = ({ players, isHost, onPlayAgain }) => {
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

            {isHost && (
                <button
                    onClick={onPlayAgain}
                    className="mx-auto mt-8 px-12 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-black text-2xl rounded-full shadow-xl transform hover:scale-105 transition"
                >
                    PLAY AGAIN 🔄
                </button>
            )}
        </div>
    );
};

export default ScoreboardView;
