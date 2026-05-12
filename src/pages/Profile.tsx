import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { calculateLevel, formatXP, getProgressToNextLevel } from '../lib/utils';
import { 
  Award, 
  Settings, 
  LogOut, 
  Calendar, 
  CheckCircle2, 
  Mail, 
  Share2,
  FileText,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { logout } from '../services/authService';

import BackButton from '../components/BackButton';

export default function Profile() {
  const { profile, user } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'certificates'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      getDocs(q).then(snap => {
        setCertificates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [user]);

  if (!profile || !user) return null;

  const level = calculateLevel(profile.xp);
  const progress = getProgressToNextLevel(profile.xp);

  const stats = [
    { label: 'Total XP', value: formatXP(profile.xp), icon: Award, color: 'text-blue-500' },
    { label: 'Days Streak', value: profile.streak, icon: Calendar, color: 'text-orange-500' },
    { label: 'Badges', value: profile.badges?.length || 0, icon: Award, color: 'text-amber-500' },
    { label: 'Courses', value: profile.enrolledSubjects?.length || 0, icon: CheckCircle2, color: 'text-emerald-500' },
  ];

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-4xl mx-auto">
      <BackButton />
      {/* Header Profile */}
      <section className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
        <div className="relative">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-slate-800 p-1 border-2 border-blue-500/30 overflow-hidden shadow-2xl">
            <img src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-full h-full object-cover rounded-[2.2rem]" alt={profile.displayName!} />
          </div>
          <div className="absolute -bottom-3 left-1/2 -md:left-1/2 -translate-x-1/2 bg-blue-600 text-white font-black px-4 py-1 rounded-full border-4 border-slate-950 text-sm">
            LEVEL {level}
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <div>
            <h1 className="text-4xl font-black">{profile.displayName}</h1>
            <div className="flex items-center justify-center md:justify-start gap-3 text-slate-500 mt-1">
              <span className="flex items-center gap-1 text-sm"><Mail size={14} /> {profile.email}</span>
              <span className="w-1 h-1 bg-slate-700 rounded-full" />
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-500">{profile.role}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center md:justify-start">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 transition-all">
              <Settings size={18} /> Edit
            </button>
            {(profile.role === 'admin' || profile.email === 'mudzimwapanashe123@gmail.com') && (
              <Link to="/admin" className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl font-bold hover:bg-amber-500/20 transition-all">
                <ShieldCheck size={18} /> Admin Panel
              </Link>
            )}
            <button onClick={logout} className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl font-bold hover:bg-rose-500/20 transition-all">
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl border-white/5 space-y-2">
            <stat.icon className={stat.color} size={20} />
            <p className="text-3xl font-black">{stat.value}</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <section className="glass-card p-8 rounded-[2rem] border-white/5 space-y-6">
        <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest">
            <span className="text-slate-500">Journey Progress</span>
            <span className="text-blue-500">{Math.round(progress)}% to Level {level + 1}</span>
        </div>
        <div className="h-4 bg-slate-950 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-blue-600 to-emerald-400"
            />
        </div>
      </section>

      {/* Badges & Achievements */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black">Unlocked Badges</h3>
          <button className="text-blue-500 font-bold text-sm hover:underline">View All</button>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {(profile.badges && profile.badges.length > 0) ? (
            profile.badges.map((badge: string, i: number) => (
              <div key={i} className="aspect-square glass-card rounded-2xl border border-white/10 flex flex-col items-center justify-center p-4 gap-2 group hover:border-amber-500/30 transition-all">
                 <Award className="text-amber-500 group-hover:scale-110 transition-transform" size={32} />
                 <p className="text-[7px] font-black uppercase tracking-widest text-gray-500 text-center leading-tight">{badge}</p>
              </div>
            ))
          ) : (
            <div className="col-span-full py-10 text-center border-2 border-dashed border-white/5 rounded-2xl opacity-40">
              <Award className="mx-auto text-slate-700 mb-2" size={32} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Complete modules to earn badges</p>
            </div>
          )}
        </div>
      </section>
      
      {/* Recent Certificates */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black italic uppercase italic tracking-tighter">Verified <span className="text-blue-500">Credentials</span></h3>
        <div className="space-y-4">
          {certificates.map(cert => (
            <motion.div 
              key={cert.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="glass-panel p-6 rounded-[2rem] border-white/5 bg-white/2 hover:border-blue-500/20 transition-all group flex items-center justify-between gap-4"
            >
               <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                     <ShieldCheck size={28} />
                  </div>
                  <div>
                     <h4 className="text-base font-black uppercase tracking-tight text-white/90">{cert.topicName}</h4>
                     <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mt-1">Verified on {cert.createdAt?.toDate ? new Date(cert.createdAt.toDate()).toLocaleDateString() : 'Recent'}</p>
                  </div>
               </div>
               <Link 
                 to={`/verify/${cert.id}`}
                 className="p-3 bg-white/5 hover:bg-blue-500 hover:text-black rounded-xl text-gray-500 transition-all border border-white/5 group-hover:border-blue-500/30"
               >
                  <ExternalLink size={18} />
               </Link>
            </motion.div>
          ))}
          {certificates.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-12 bg-white/[0.02] rounded-[2.5rem] border-2 border-dashed border-white/5">
              Complete topic modules and assessments to earn your verifiable neural credentials.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
