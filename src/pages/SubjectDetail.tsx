import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { getTopics, getUserTopics } from '../services/dbService';
import { useAuth } from '../AuthContext';
import { Lock, CheckCircle2, Trophy, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { PaymentService } from '../services/paymentService';
import BackButton from '../components/BackButton';

export default function SubjectDetail() {
  const { subjectId } = useParams();
  const { user, profile } = useAuth();
  const [topics, setTopics] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [subjectId, user]);

  const fetchData = async () => {
    if (subjectId && user) {
        setLoading(true);
        const [topicsRes, progressRes] = await Promise.all([
          getTopics(subjectId),
          getUserTopics(user.uid)
        ]);
        setTopics(topicsRes as any[]);
        setProgress(progressRes.filter((p: any) => p.subjectId === subjectId));
        setLoading(false);
    }
  };

  const getTopicStatus = (topicId: string) => {
    const prog = progress.find(p => p.topicId === topicId);
    if (!prog) return 'locked';
    return prog.status; // unlocked, completed
  };

  const [unlockError, setUnlockError] = useState<string | null>(null);

  const handleUnlock = async (topic: any) => {
    if (!user) return;
    setUnlocking(topic.id);
    setUnlockError(null);
    try {
      const res = await PaymentService.initiatePayment(
        user.uid,
        user.email || '',
        topic.id,
        topic.price,
        subjectId || '',
        topic.title
      );
      if (res.success && res.redirectUrl) {
         window.location.href = res.redirectUrl;
      } else {
        setUnlockError('Payment initiation failed. Please try again.');
        setUnlocking(null);
      }
    } catch (err: any) {
      setUnlockError(err.message || 'Payment failed. Please try again.');
      setUnlocking(null);
    }
  };

  const renderHexButton = (topic: any) => {
    const status = getTopicStatus(topic.id);

    return (
        <button 
          disabled={unlocking === topic.id}
          onClick={async (e) => {
            if (status === 'locked') {
                e.preventDefault();
                await handleUnlock(topic);
            }
          }}
          className={cn(
            "flex flex-col items-center justify-center w-48 h-48 hex-path transition-all duration-500 z-10 relative overflow-hidden",
            status === 'completed' ? "bg-cyan-500 glow-cyan" : 
            status === 'unlocked' ? "bg-[#0F172A] border-2 border-cyan-400 glow-cyan" :
            "bg-gray-800 border-2 border-white/5 opacity-40 grayscale cursor-pointer"
          )}
        >
          {unlocking === topic.id && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
                <Loader2 className="animate-spin text-cyan-400" />
            </div>
          )}
          <div className={cn(
            "w-12 h-12 flex items-center justify-center mb-1",
            status === 'completed' ? "text-white" : status === 'unlocked' ? "text-cyan-400" : "text-gray-500"
          )}>
            {status === 'completed' ? <CheckCircle2 size={32} /> :
             status === 'unlocked' ? <span className="text-3xl">✨</span> :
             <Lock size={32} />}
          </div>
        </button>
    );
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#05070A] text-cyan-400 font-black italic">INITIALIZING MASTER PATH...</div>;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-12">
      <BackButton to="/discover" label="Return to Subjects" />

      <header className="text-center space-y-2">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter">Path of <span className="text-cyan-400">Mastery</span></h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Decipher the subjects one node at a time</p>
      </header>

      {unlockError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400">
          <span className="text-xs font-bold">⚠ {unlockError}</span>
          <button onClick={() => setUnlockError(null)} className="ml-auto text-rose-400/60 hover:text-rose-400 text-xs font-black">✕</button>
        </div>
      )}

      <div className="relative flex flex-col items-center py-10 space-y-24">
        {topics.map((topic, index) => {
          const status = getTopicStatus(topic.id);
          const isLast = index === topics.length - 1;

          return (
            <div key={topic.id} className="relative flex flex-col items-center">
              {!isLast && (
                <div className={cn(
                  "absolute top-full w-1 h-24 bg-white/5 -z-10",
                  status === 'completed' ? "bg-cyan-500/50 shadow-[0_0_10px_rgba(0,242,255,0.5)]" : ""
                )} />
              )}

              <motion.div
                whileHover={status !== 'locked' ? { scale: 1.05 } : {}}
                className="relative group"
              >
                {status !== 'locked' ? (
                    <Link to={`/topic/${subjectId}/${topic.id}`}>
                        {renderHexButton(topic)}
                    </Link>
                ) : (
                    renderHexButton(topic)
                )}

                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center w-48">
                    <h3 className={cn(
                      "font-black text-[10px] uppercase tracking-widest",
                      status === 'completed' ? "text-cyan-400" : status === 'unlocked' ? "text-white" : "text-gray-500"
                    )}>{topic.title}</h3>
                    <div className="flex items-center justify-center gap-2 mt-1 opacity-60">
                      <span className="text-[8px] font-black uppercase tracking-tighter flex items-center gap-1">
                         {topic.xpReward} XP
                      </span>
                      {status === 'locked' && (
                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">
                          ${topic.price}
                        </span>
                      )}
                    </div>
                </div>

                {status === 'unlocked' && (
                  <div className="absolute inset-0 bg-cyan-400/20 hex-path animate-ping -z-10" />
                )}
              </motion.div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center pt-20 text-center space-y-4 pb-20">
        <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center border-4 border-amber-500/30 animate-pulse glow-gold">
          <Trophy className="text-amber-500" size={48} />
        </div>
        <div>
          <h3 className="text-2xl font-black italic uppercase italic">Final Validation</h3>
          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Complete the path to unlock the Subject Mastery Protocol.</p>
        </div>
      </div>
    </div>
  );
}
