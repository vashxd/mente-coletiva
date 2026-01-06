import React from 'react';
import { motion } from 'framer-motion';

const QuestionView = ({
    question,
    round,
    players,
    myAnswer,
    setMyAnswer,
    onSubmit,
    hasSubmitted,
    timer
}) => {
    return (
        <div className="text-center max-w-6xl w-full h-full flex flex-col justify-between py-8 md:py-12 px-4">
            <div>
                {!hasSubmitted ? (
                    <div className="flex flex-col items-center gap-4 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h2 className="text-xl text-purple-300 font-bold uppercase tracking-widest">Your Answer</h2>
                        <div className="w-full max-w-2xl flex gap-2">
                            <input
                                value={myAnswer}
                                onChange={e => setMyAnswer(e.target.value)}
                                className="flex-1 bg-gray-800 border-2 border-purple-500 rounded-xl px-6 py-4 text-2xl text-white placeholder-gray-500 focus:outline-none focus:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition"
                                placeholder="Type here..."
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && onSubmit()}
                            />
                            <button
                                onClick={onSubmit}
                                className="bg-green-500 hover:bg-green-600 text-white px-8 rounded-xl font-black uppercase text-xl transition transform active:scale-95"
                            >
                                SEND
                            </button>
                        </div>
                    </div>
                ) : (
                    <h2 className="text-xl md:text-3xl text-pink-400 font-bold uppercase tracking-widest mb-4 md:mb-8 animate-pulse">
                        Answer Sent! Waiting for others...
                    </h2>
                )}

                {/* Visual Question Header */}
                <div className="mb-4">
                    <span className="px-4 py-1 bg-purple-900 rounded-full text-purple-300 font-bold uppercase tracking-widest text-xs border border-purple-700">
                        Round {round}
                    </span>
                </div>
                <h1 className="text-3xl md:text-6xl font-bold opacity-90 leading-tight mb-8">{question?.text}</h1>
            </div>

            {/* Players Status Grid */}
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

            {/* Timer Bar */}
            <div className="w-full h-4 md:h-6 bg-gray-800 rounded-full overflow-hidden border border-gray-700 shadow-inner mt-4">
                <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 30, ease: "linear" }} // Ideally pass timer duration prop
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-600"
                />
            </div>
        </div>
    );
};

export default QuestionView;
