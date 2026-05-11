import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, GraduationCap, Globe, Layers } from 'lucide-react';
import { getSubjects } from '../services/dbService';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Discover() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getSubjects().then(res => {
      setSubjects(res);
      setLoading(false);
    });
  }, []);

  const filtered = subjects.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.syllabus.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
      <header className="space-y-4">
        <h1 className="text-4xl font-black">Find Your Subject</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search Maths, Physics, Cambridge..."
            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-900 animate-pulse rounded-[2rem]" />)
        ) : (
          filtered.map((subject, idx) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link 
                to={`/discover/${subject.id}`}
                className="block group relative bg-[#0A0C14] rounded-[2rem] p-6 border border-white/5 hover:glow-cyan transition-all overflow-hidden"
              >
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-4xl">{subject.icon || '📚'}</span>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      subject.syllabus === 'Cambridge' ? "text-purple-400 border-purple-400/20 bg-purple-400/10" : "text-cyan-400 border-cyan-400/20 bg-cyan-400/10"
                    )}>
                      {subject.syllabus}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-black italic group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{subject.name}</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{subject.level} • {subject.topicsCount || 0} Modules</p>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-1 text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                      <Layers size={14} /> {subject.totalXP || 0} Potential XP
                    </div>
                  </div>
                </div>

                {/* Accent line */}
                <div 
                  className="absolute bottom-0 left-0 h-1 transition-all group-hover:h-2 opacity-50" 
                  style={{ backgroundColor: subject.color || '#00F2FF', width: '100%' }}
                />
              </Link>
            </motion.div>
          ))
        )}

        {!loading && filtered.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="text-6xl opacity-20">🔍</div>
            <h3 className="text-xl font-bold text-slate-500">No subjects found for "{search}"</h3>
            <p className="text-slate-600">Try searching for a different keyword or syllabus.</p>
          </div>
        )}
      </div>
    </div>
  );
}
