import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Trophy, ShieldCheck, AlertCircle, Loader2, Cpu } from 'lucide-react';
import { loginWithGoogle } from '../services/authService';
import { useAuth } from '../AuthContext';
import { Navigate } from 'react-router-dom';

export default function Landing() {
  const { user, authError } = useAuth();
  const [error, setError] = useState<string | null>(authError);
  const [loading, setLoading] = useState(false);

  // Show redirect errors that come back from Google
  useEffect(() => {
    if (authError) setError(authError);
  }, [authError]);

  if (user) return <Navigate to="/" />;

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    const err = await loginWithGoogle();
    // Popup closes (success or user dismissed), so always reset loading
    setLoading(false);
    if (err) setError(err);
  };

  const features = [
    {
      icon: BookOpen,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      title: 'Curriculum',
      desc: 'ZIMSEC & Cambridge expert-curated content.',
    },
    {
      icon: Trophy,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      title: 'Gamified',
      desc: 'Earn XP, climb ranks & unlock badges.',
    },
    {
      icon: Cpu,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      title: 'AI-Powered',
      desc: 'Smart assessments & live tutoring.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 ek-logo rounded-3xl flex items-center justify-center shadow-xl"
          >
            <span className="text-3xl font-black italic text-white leading-none">EK</span>
          </motion.div>
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
            Exam<span className="text-cyan-400">Kraft</span>
          </h1>
          <p className="text-gray-500 text-sm font-bold tracking-[0.2em] uppercase">
            Mastery Engine v1.0
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-3 text-left">
          {features.map((f) => (
            <div key={f.title} className={`p-4 glass-panel rounded-2xl space-y-2 border ${f.bg}`}>
              <f.icon className={`${f.color} w-5 h-5`} />
              <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-300">{f.title}</h3>
              <p className="text-[9px] text-gray-500 font-bold leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-left"
          >
            <AlertCircle className="text-red-400 w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-red-300 text-xs font-semibold leading-relaxed">{error}</p>
          </motion.div>
        )}

        {/* Login Button */}
        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-cyan-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5 brightness-0 invert" alt="Google" />
          )}
          {loading ? 'Opening Google...' : 'Sign in with Google'}
        </button>

        {/* Legal / Trust line */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" /> ZIMSEC &amp; Cambridge Accredited Materials
          </p>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            By signing in you agree to our{' '}
            <a href="#" className="underline hover:text-slate-400 transition-colors">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="underline hover:text-slate-400 transition-colors">Privacy Policy</a>.
          </p>
        </div>
      </motion.div>
      
      {/* Background blobs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-3/4 left-1/2 w-48 h-48 bg-cyan-600/5 rounded-full blur-[80px]" />
      </div>
    </div>
  );
}
