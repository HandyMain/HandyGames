
import React, { useState } from 'react';
import { Hammer, Settings } from 'lucide-react';
import { JOBS, CATEGORIES, JobDef } from './Handyman_Data';
import { HandymanEngine } from './Handyman_Engine';
import { speak } from '../utils';

export const HandymanMode = () => {
    const [activeJob, setActiveJob] = useState<JobDef | null>(null);

    const handleJobSelect = (job: JobDef) => {
        setActiveJob(job);
        speak(`Let's fix the ${job.title}.`);
    };

    if (activeJob) {
        return <HandymanEngine job={activeJob} onBack={() => setActiveJob(null)} />;
    }

    return (
        <div className="w-full h-[80vh] flex flex-col items-center pt-8 bg-slate-50 rounded-[2rem] overflow-hidden shadow-xl border-4 border-slate-200">
            {/* Header */}
            <div className="bg-slate-800 text-white px-8 py-3 rounded-full mb-8 shadow-lg border-2 border-slate-600 flex items-center gap-3">
                <Settings className="animate-spin-slow" />
                <span className="font-black text-xl tracking-widest uppercase">Master Fixer</span>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto w-full px-4 scrollbar-hide">
                {CATEGORIES.map(cat => (
                    <div key={cat.id} className={`flex-shrink-0 px-4 py-1 rounded-full text-xs font-bold uppercase border bg-white ${cat.color} border-slate-200 whitespace-nowrap`}>
                        {cat.name}
                    </div>
                ))}
            </div>

            {/* Job Grid */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md px-4 overflow-y-auto pb-24 scrollbar-hide">
                {JOBS.map(job => {
                    const category = CATEGORIES.find(c => c.id === job.categoryId);
                    const CategoryIcon = category ? category.icon : Hammer;
                    const catColor = category ? category.color : 'text-slate-700';
                    
                    return (
                        <button
                            key={job.id}
                            onClick={() => handleJobSelect(job)}
                            className="relative aspect-square rounded-3xl p-4 flex flex-col items-center justify-center gap-3 text-center border-4 border-slate-200 bg-white shadow-sm hover:scale-105 hover:shadow-xl hover:border-blue-400 transition-all group"
                        >
                            <div className={`text-4xl ${catColor} group-hover:scale-110 transition-transform`}>
                                <CategoryIcon />
                            </div>
                            <div>
                                <div className="font-bold text-lg leading-tight text-slate-800">{job.title}</div>
                                <div className="text-[10px] uppercase font-bold text-slate-400 mt-1 line-clamp-2">{job.description}</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
