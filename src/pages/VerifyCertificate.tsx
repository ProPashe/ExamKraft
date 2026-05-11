import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ShieldCheck, Calendar, User, BookOpen, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

import BackButton from '../components/BackButton';

export default function VerifyCertificate() {
  const { certId } = useParams();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (certId) {
      getDoc(doc(db, 'certificates', certId)).then(snap => {
        if (snap.exists()) setCert(snap.data());
        setLoading(false);
      });
    }
  }, [certId]);

  if (loading) return (
    <div className="h-screen bg-[#05070A] flex flex-col items-center justify-center gap-4">
       <Loader2 className="text-cyan-400 animate-spin" size={48} />
       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Querying Global Chain...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05070A] p-6 flex flex-col items-center justify-center gap-8">
       <BackButton />
       <div className="max-w-2xl w-full">
          {cert ? (
            <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="glass-panel p-12 rounded-[3.5rem] bg-[#0A0C14] border-emerald-500/20 text-center space-y-10 shadow-2xl shadow-emerald-500/5"
            >
               <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-500">
                  <ShieldCheck size={40} />
               </div>
               
               <div className="space-y-2">
                  <h1 className="text-4xl font-black italic uppercase italic tracking-tighter">Credential <span className="text-emerald-400">Verified</span></h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Authentic Knowledge Node Validation</p>
               </div>

               <div className="grid md:grid-cols-2 gap-4 text-left">
                  <div className="p-6 bg-white/2 rounded-2xl border border-white/5 space-y-1">
                     <span className="text-[8px] font-black uppercase text-gray-600 tracking-widest">Master</span>
                     <div className="flex items-center gap-2">
                        <User size={14} className="text-cyan-400" />
                        <span className="text-sm font-black italic">{cert.userName}</span>
                     </div>
                  </div>
                  <div className="p-6 bg-white/2 rounded-2xl border border-white/5 space-y-1">
                     <span className="text-[8px] font-black uppercase text-gray-600 tracking-widest">Subject Sector</span>
                     <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-purple-500" />
                        <span className="text-sm font-black italic">{cert.topicName}</span>
                     </div>
                  </div>
                  <div className="p-6 bg-white/2 rounded-2xl border border-white/5 space-y-1">
                     <span className="text-[8px] font-black uppercase text-gray-600 tracking-widest">Validation Date</span>
                     <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-amber-500" />
                        <span className="text-sm font-black italic">{cert.createdAt?.toDate ? new Date(cert.createdAt.toDate()).toLocaleDateString() : 'Unknown'}</span>
                     </div>
                  </div>
                  <div className="p-6 bg-white/2 rounded-2xl border border-white/5 space-y-1">
                     <span className="text-[8px] font-black uppercase text-gray-600 tracking-widest">Node ID</span>
                     <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-mono text-gray-500">{certId}</span>
                     </div>
                  </div>
               </div>

               <p className="text-xs text-gray-500 font-medium italic leading-relaxed">
                  This digital credential confirms that the individual above has demonstrated mastery of the specified academic node within the ExamKraft neural framework.
               </p>
            </motion.div>
          ) : (
            <div className="text-center space-y-6">
               <AlertTriangle className="mx-auto text-rose-500" size={64} />
               <h2 className="text-3xl font-black italic uppercase tracking-tighter">Protocol <span className="text-rose-500">Violation</span></h2>
               <p className="text-gray-500 text-sm font-bold">The requested credential node does not exist or has been retracted from the global chain.</p>
            </div>
          )}
       </div>
    </div>
  );
}
