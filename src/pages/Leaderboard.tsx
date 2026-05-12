import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Star, Target, Search } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn, formatXP } from '../lib/utils';
import { useAuth } from '../AuthContext';
import BackButton from '../components/BackButton';

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myEntry, setMyEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(50));
      const snap = await getDocs(q);
      const all = snap.docs.map((doc, i) => ({ id: doc.id, rank: i + 1, ...doc.data() }));
      setLeaders(all.slice(0, 10));
      if (user) {
        const me = all.find(u => u.id === user.uid);
        if (me) {
          setMyRank(me.rank);
          setMyEntry(me);
        } else {
          // outside top 50 — show rank as 50+
          setMyRank(51);
        }
      }
      setLoading(false);
    };
    fetchLeaders();
  }, [user]);

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-4xl mx-auto">
      <BackButton />
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full font-bold border border-amber-500/20">
          <Trophy size={20} /> Hall of Fame
        </div>
        <h1 className="text-5xl font-black tracking-tight">Top Scholars</h1>
        <p className="text-slate-500 max-w-md mx-auto">The most dedicated minds striving for academic excellence across Zimbabwe & beyond.</p>
      </header>

      {/* Your Rank Card */}
      {!loading && myEntry && (
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] flex items-center gap-5">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-400 overflow-hidden flex-shrink-0">
            <img src={myEntry.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${myEntry.uid}`} alt="You" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-0.5">Your Standing</p>
            <p className="font-black text-white uppercase tracking-tight italic truncate">{myEntry.displayName}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-black italic text-cyan-400">#{myRank === 51 ? '50+' : myRank}</p>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{formatXP(myEntry.xp)} XP</p>
          </div>
        </div>
      )}

      {/* Podium */}
      {!loading && leaders.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 md:gap-6 items-end pt-10 px-4">
          {/* 2nd Place */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-800 rounded-full border-4 border-slate-400 overflow-hidden">
                <img src={leaders[1].photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaders[1].uid}`} alt="2nd" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center font-bold text-slate-900 border-4 border-slate-950">2</div>
            </div>
            <div className="text-center">
              <p className="font-bold truncate w-24 md:w-full">{leaders[1].displayName}</p>
              <p className="text-xs text-slate-500">{formatXP(leaders[1].xp)} XP</p>
            </div>
            <div className="w-full h-24 md:h-32 bg-slate-900 rounded-t-3xl border-x border-t border-white/5 shadow-2xl" />
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="w-20 h-20 md:w-32 md:h-32 bg-[#0A0C14] rounded-full border-4 border-cyan-400 overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                <img src={leaders[0].photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaders[0].uid}`} alt="1st" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-cyan-400 rounded-full flex items-center justify-center font-black text-slate-950 border-4 border-[#05070A] shadow-lg">1</div>
              <Medal className="absolute -top-10 left-1/2 -translate-x-1/2 text-cyan-400 w-12 h-12 animate-bounce" />
            </div>
            <div className="text-center">
              <p className="font-black text-xl italic truncate w-24 md:w-full tracking-tighter uppercase">{leaders[0].displayName}</p>
              <p className="text-xs text-cyan-400 font-black uppercase tracking-[0.2em]">{formatXP(leaders[0].xp)} XP</p>
            </div>
            <div className="w-full h-32 md:h-48 bg-cyan-400/10 rounded-t-3xl border-x border-t border-cyan-400/30 shadow-[0_0_50px_rgba(0,242,255,0.1)]" />
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-800 rounded-full border-4 border-amber-800 overflow-hidden">
                <img src={leaders[2].photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaders[2].uid}`} alt="3rd" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-800 rounded-full flex items-center justify-center font-bold text-slate-900 border-4 border-slate-950">3</div>
            </div>
            <div className="text-center">
              <p className="font-bold truncate w-24 md:w-full">{leaders[2].displayName}</p>
              <p className="text-xs text-slate-500">{formatXP(leaders[2].xp)} XP</p>
            </div>
            <div className="w-full h-20 md:h-24 bg-slate-900 rounded-t-3xl border-x border-t border-white/5" />
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-slate-900 animate-pulse rounded-2xl" />)
        ) : (
          leaders.slice(3).map((leader, i) => (
            <motion.div 
              key={leader.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel p-4 rounded-2xl flex items-center gap-4 group hover:glow-cyan transition-all"
            >
              <div className="w-10 font-black text-gray-500 text-center italic">#{i + 4}</div>
              <div className="w-12 h-12 rounded-xl bg-[#0A0C14] border border-white/5 overflow-hidden">
                <img src={leader.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.uid}`} alt={leader.displayName} />
              </div>
              <div className="flex-1">
                <h4 className="font-black uppercase tracking-tight italic">{leader.displayName}</h4>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Scholar Rank {Math.floor(Math.sqrt(leader.xp / 100)) + 1}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-cyan-400 font-black italic">
                  <Star size={14} fill="currentColor" /> {formatXP(leader.xp)}
                </div>
                <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Mastery Pts</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {!loading && leaders.length === 0 && (
         <div className="glass-card p-10 rounded-[2rem] text-center space-y-4">
            <Trophy className="mx-auto text-slate-700" size={64} />
            <h3 className="text-xl font-bold">Leaderboard is empty</h3>
            <p className="text-slate-500">Be the first to join the ranks!</p>
         </div>
      )}
    </div>
  );
}
