import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Megaphone, Bell, ArrowLeft, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';

import BackButton from '../components/BackButton';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-[#05070A] text-white p-6 md:p-12 max-w-4xl mx-auto space-y-12 pb-32">
       <BackButton />
       <header className="flex items-center gap-6 mt-4">
          <div>
             <h2 className="text-gray-500 font-bold text-xs uppercase tracking-[0.3em]">Communication Stream</h2>
             <h1 className="text-4xl font-black italic uppercase">Grid <span className="text-blue-400">Bulletins</span></h1>
          </div>
       </header>

       {loading ? (
         <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-40">
            <Clock className="animate-spin text-blue-400" size={32} />
            <p className="text-xs font-black uppercase tracking-widest">Synchronizing Broadcasts...</p>
         </div>
       ) : (
         <div className="space-y-6">
            {announcements.map((ann, i) => (
              <motion.div
                key={ann.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-8 md:p-10 rounded-[2.5rem] bg-[#0A0C14] border-white/5 space-y-6 hover:border-blue-500/20 transition-all relative overflow-hidden group"
              >
                 <div className="flex justify-between items-start relative z-10">
                    <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400">
                       <Megaphone size={24} />
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Node Seq: {ann.id.substring(0, 8)}</span>
                    </div>
                 </div>

                 <div className="space-y-4 relative z-10">
                    <h2 className="text-2xl md:text-3xl font-black italic uppercase italic leading-tight text-white/90">{ann.title}</h2>
                    <p className="text-gray-400 font-medium leading-relaxed md:text-lg">{ann.message}</p>
                 </div>

                 <div className="pt-8 border-t border-white/5 flex flex-wrap gap-6 items-center relative z-10">
                    <div className="flex items-center gap-2 text-gray-500">
                       <User size={14} className="text-blue-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest">{ann.author || 'Master Curator'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                       <Clock size={14} className="text-blue-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest">
                          {ann.createdAt?.toDate ? new Date(ann.createdAt.toDate()).toLocaleString() : 'Just Now'}
                       </span>
                    </div>
                 </div>

                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-blue-500/10 transition-all" />
              </motion.div>
            ))}

            {announcements.length === 0 && (
              <div className="py-32 glass-panel rounded-[3rem] border-dashed border-white/10 flex flex-col items-center justify-center opacity-30 italic">
                 <Bell size={48} className="mb-4" />
                 Grid silence. No broadcasts detected.
              </div>
            )}
         </div>
       )}
    </div>
  );
}
