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
        <div className="text-center max-w-6xl w-full h-full flex flex-col justify-between py-4 md:py-8 px-4">

            {/* Top Section: Question & Status */}
            <div className="flex-1 flex flex-col justify-center">
                {!hasSubmitted ? (
                    <>
                        <div className="mb-4">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Question</span>
                            <h1 className="text-2xl md:text-5xl font-black opacity-90 leading-tight mt-2">{question?.text}</h1>
                        </div>

                        <div className="flex flex-col items-center gap-4 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <input
                                value={myAnswer}
                                onChange={e => setMyAnswer(e.target.value)}
                                className="w-full max-w-2xl bg-gray-800 border-2 border-purple-500 rounded-2xl px-6 py-4 text-2xl text-white placeholder-gray-500 focus:outline-none focus:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition text-center"
                                placeholder="Type your answer..."
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && onSubmit()}
                            />
                            <button
                                onClick={onSubmit}
                                className="w-full max-w-xs bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-black uppercase text-xl transition transform active:scale-95 shadow-lg"
                            >
                                SEND
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                        <h2 className="text-3xl md:text-5xl text-green-400 font-black uppercase tracking-widest mb-4 animate-bounce">
                            Answer Sent!
                        </h2>
                        <p className="text-gray-400 text-lg">Relax and wait for the slowpokes.</p>
                    </div>
                )}
            </div>

            {/* Bottom Section: Players Grid & Timer */}
            <div className="mt-4">
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 p-2 max-h-[20vh] overflow-y-auto">
                    {Object.values(players).map(p => (
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: p.isAnswered ? 1.1 : 1, backgroundColor: p.isAnswered ? '#10B981' : '#1F2937' }}
                            key={p.id}
                            className={`p-2 rounded-lg text-center font-bold text-xs md:text-sm truncate transition-colors duration-300 ${p.isAnswered ? 'text-white' : 'text-gray-500'}`}
                        >
                            {p.name}
                        </motion.div>
                    ))}
                </div>

                <div className="w-full h-3 md:h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700 shadow-inner mt-4">
                    <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: timer, ease: "linear" }}
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-600"
                    />
                </div>
            </div>
        </div>
    );
};

export default QuestionView;
