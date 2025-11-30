
import React, { useState } from 'react';
import { Hammer, Settings, ArrowRight, Wrench } from 'lucide-react';
import { JOBS, CATEGORIES, JobDef } from './Handyman_Data';
import { HandymanEngine } from './Handyman_Engine';
import { speak } from '../utils';

export const HandymanMode = ({ onUnlock }: { onUnlock?: (id: string) => void }) => {
    const [activeJob, setActiveJob] = useState<JobDef | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const handleJobSelect = (job: JobDef) => {
        setActiveJob(job);
        speak(`Let's fix the ${job.title}.`);
    };

    if (activeJob) {
        return <HandymanEngine job={activeJob} onBack={() => setActiveJob(null)} onUnlock={onUnlock} />;
    }

    const filteredJobs = selectedCategory === 'all' 
        ? JOBS 
        : JOBS.filter(j => j.categoryId === selectedCategory);

    return (
        <div className="w-full min-h-screen flex flex-col items-center bg-slate-50 pt-20 pb-24 overflow-y-auto">
            
            {/* Header */}
            <div className="w-full max-w-xl bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl mb-8 flex flex-col items-center text-center relative overflow-hidden mx-4 shrink-0">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Wrench size={120} />
                </div>
                <div className="bg-slate-800 p-4 rounded-full mb-4 shadow-inner">
                    <Hammer className="text-blue-400 w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-widest text-blue-100 mb-2">Master Fixer</h1>
                <p className="text-slate-400 text-base font-medium max-w-xs">Pick a job ticket and get your tools ready!</p>
            </div>

            {/* Category Filter (Horizontal Scroll) */}
            <div className="w-full max-w-xl mb-8 overflow-x-auto no-scrollbar pl-4 shrink-0">
                <div className="flex gap-3 min-w-max pr-6">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-6 py-3 rounded-full text-sm font-black transition-all border-2 shadow-sm ${selectedCategory === 'all' ? 'bg-slate-800 border-slate-800 text-white scale-105' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                        ALL JOBS
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-6 py-3 rounded-full text-sm font-bold transition-all border-2 flex items-center gap-2 whitespace-nowrap shadow-sm
                                ${selectedCategory === cat.id 
                                    ? `bg-white ${cat.color.replace('text-', 'border-')} ${cat.color} scale-105` 
                                    : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                                }
                            `}
                        >
                            <cat.icon size={16} />
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Job List (Vertical Stack) */}
            <div className="w-full max-w-xl flex flex-col gap-4 px-4 pb-12">
                {filteredJobs.map(job => {
                    const category = CATEGORIES.find(c => c.id === job.categoryId);
                    const CategoryIcon = category ? category.icon : Hammer;
                    const catColor = category ? category.color : 'text-slate-700';
                    
                    return (
                        <button
                            key={job.id}
                            onClick={() => handleJobSelect(job)}
                            className="bg-white p-5 rounded-[2rem] shadow-lg border-2 border-slate-100 hover:border-blue-300 hover:shadow-xl transition-all active:scale-98 flex items-center gap-5 text-left group"
                        >
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center bg-slate-50 text-3xl group-hover:scale-110 transition-transform ${catColor} shadow-inner`}>
                                <CategoryIcon size={32} />
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-slate-50 border border-slate-100 ${catColor}`}>
                                        {category?.name}
                                    </span>
                                </div>
                                <h3 className="font-black text-xl text-slate-800 leading-tight mb-1 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                                <p className="text-slate-400 text-sm font-medium line-clamp-1">{job.description}</p>
                            </div>

                            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                                <ArrowRight size={24} />
                            </div>
                        </button>
                    );
                })}
                {filteredJobs.length === 0 && (
                    <div className="text-center py-12 text-slate-400 font-bold flex flex-col items-center">
                        <Settings className="mb-4 opacity-20" size={48} />
                        No jobs found in this category.
                    </div>
                )}
            </div>
        </div>
    );
};
