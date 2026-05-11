import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../../AuthContext';
import { Monitor, Plus, Play, Link as LinkIcon, Users, Clock, ArrowRight, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

import BackButton from '../../components/BackButton';

export default function LiveBoard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const q = query(collection(db, 'sessions'), orderBy('createdAt', 'desc'), limit(10));
    const snap = await getDocs(q);
    setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const startNewSession = async () => {
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'sessions'), {
        hostUid: user?.uid,
        boardData: {},
        participants: [user?.uid],
        createdAt: serverTimestamp(),
        isActive: true
      });
      navigate(`/whiteboard/${docRef.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-12 space-y-12 max-w-5xl mx-auto">
      <BackButton to="/admin" label="Exit Active Session" />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-gray-500 font-bold text-xs uppercase tracking-[0.3em]">Teaching Suite</h2>
           <h1 className="text-4xl font-black italic uppercase italic tracking-tighter text-white">Live <span className="text-cyan-400">Classroom</span></h1>
           <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Initialize real-time knowledge transmission</p>
        </div>
        <button 
          onClick={startNewSession}
          disabled={loading}
          className="px-10 py-5 bg-cyan-500 rounded-3xl font-black italic uppercase tracking-[0.3em] text-sm text-black shadow-2xl shadow-cyan-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
           {loading ? 'Initializing...' : <><Play fill="black" size={18} /> Start New Session</>}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="glass-panel p-10 rounded-[3rem] bg-cyan-500/5 border-cyan-500/20 space-y-8 flex flex-col justify-center">
            <div className="w-20 h-20 rounded-[2.5rem] bg-cyan-500/10 flex items-center justify-center text-cyan-400">
               <Monitor size={40} />
            </div>
            <div className="space-y-4">
               <h3 className="text-2xl font-black italic uppercase italic tracking-tighter">Synchronized <span className="text-cyan-400">Whiteboard</span></h3>
               <p className="text-gray-400 text-sm font-medium leading-relaxed">Engage students with a high-fidelity, real-time board. Draw, type, and explain concepts live. All changes are instantly synced to student terminals.</p>
            </div>
            <div className="flex items-center gap-4 pt-4">
               <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-[#0A0C14] border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-cyan-400">U</div>
                  ))}
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">420+ Sessions Conducted</span>
            </div>
         </div>

         <div className="glass-panel p-10 rounded-[3rem] bg-white/2 border-white/5 space-y-8 flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-white/5 pb-4">Recent Transmissions</h3>
            <div className="flex-1 space-y-4">
               {sessions.map(session => (
                 <div key={session.id} className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5 group hover:border-cyan-500/20 transition-all cursor-pointer" onClick={() => navigate(`/whiteboard/${session.id}`)}>
                    <div className="flex items-center gap-4">
                       <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        session.isActive ? "bg-cyan-500/10 text-cyan-400" : "bg-white/5 text-gray-600"
                       )}>
                          <Clock size={20} />
                       </div>
                       <div>
                          <p className="text-xs font-black uppercase tracking-tight text-white/80">Room: {session.id.substring(0, 8)}</p>
                          <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{session.createdAt?.toDate ? new Date(session.createdAt.toDate()).toLocaleDateString() : 'Active'}</p>
                       </div>
                    </div>
                    <ArrowRight size={18} className="text-gray-700 group-hover:text-cyan-400 transition-all" />
                 </div>
               ))}
               {sessions.length === 0 && (
                 <div className="h-40 flex items-center justify-center italic text-gray-700 opacity-30 text-sm">No historical sessions found.</div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
