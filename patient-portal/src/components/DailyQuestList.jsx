import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';

const DailyQuestList = () => {
    // Initial quest state
    const [quests, setQuests] = useState([
        { id: 1, title: 'Drink 8 glasses of water', completed: true, type: 'hydration' },
        { id: 2, title: 'Sleep for 8 hours', completed: true, type: 'sleep' },
        { id: 3, title: 'Take Vitamin D', completed: true, type: 'medication' },
        { id: 4, title: 'Log current mood', completed: true, type: 'mindfulness' },
        { id: 5, title: 'Walk 5,000 steps', completed: false, type: 'activity' },
        { id: 6, title: 'Deep breathing (5 min)', completed: false, type: 'mindfulness' },
        { id: 7, title: 'No sugary drinks', completed: false, type: 'nutrition' },
    ]);

    const completedCount = quests.filter(q => q.completed).length;
    const progressPercentage = (completedCount / quests.length) * 100;

    const toggleQuest = (id) => {
        setQuests(quests.map(q => 
            q.id === id ? { ...q, completed: !q.completed } : q
        ));
    };

    return (
        <div className="mb-8">
            {/* Header with Progress */}
            <div className="flex justify-between items-end mb-4 px-1">
                <div>
                    <h3 className="text-lg font-bold text-sage-900">Daily Quests</h3>
                    <p className="text-xs text-sage-500 font-medium mt-1">Keep up the streak! 🔥</p>
                </div>
                <div className="text-right">
                    <span className="text-xl font-bold text-sage-900">{completedCount}</span>
                    <span className="text-sm text-sage-400 font-medium">/{quests.length}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-stone-100 rounded-full w-full mb-6 overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-peach-500 rounded-full"
                />
            </div>

            {/* Quest List */}
            <div className="space-y-3">
                {quests.map((quest, index) => (
                    <motion.div
                        key={quest.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                            group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer
                            ${quest.completed 
                                ? 'bg-sage-50/50 border-sage-100' 
                                : 'bg-white border-stone-100 hover:border-peach-200 hover:shadow-sm'
                            }
                        `}
                        onClick={() => toggleQuest(quest.id)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center transition-colors
                                ${quest.completed 
                                    ? 'bg-sage-500 text-white' 
                                    : 'bg-stone-100 text-stone-300 group-hover:bg-peach-50 group-hover:text-peach-400'
                                }
                            `}>
                                {quest.completed ? <Check size={16} strokeWidth={3} /> : <Circle size={16} />}
                            </div>
                            <span className={`
                                font-medium transition-colors
                                ${quest.completed ? 'text-sage-400 line-through' : 'text-sage-800'}
                            `}>
                                {quest.title}
                            </span>
                        </div>
                        
                        {/* Type Indicator Dot (optional visual flair) */}
                        {!quest.completed && (
                            <div className={`w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                                ${quest.type === 'hydration' ? 'bg-blue-400' :
                                  quest.type === 'sleep' ? 'bg-indigo-400' :
                                  quest.type === 'nutrition' ? 'bg-green-400' :
                                  'bg-peach-400'}
                            `} />
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default DailyQuestList;
