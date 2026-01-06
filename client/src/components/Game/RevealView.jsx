import React from 'react';
import { motion } from 'framer-motion';

const RevealView = ({ answers, players }) => {
    return (
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
};

export default RevealView;
