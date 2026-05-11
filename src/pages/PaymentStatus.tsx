import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { PaymentService } from '../services/paymentService';

export default function PaymentStatus() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const reference = searchParams.get('id') || searchParams.get('reference');
    const topicId = searchParams.get('topic') || searchParams.get('topicId');
    const subjectId = searchParams.get('subjectId');
    const paymentStatus = searchParams.get('status');

    if (!user || !reference || !topicId) return;

    const finalize = async () => {
      if (paymentStatus === 'success' || !paymentStatus) {
        try {
          // Verify with backend (which handles unlocking)
          const res = await PaymentService.verifyPayment(
            reference,
            user.uid,
            topicId,
            subjectId || ''
          );

          if (res.success) {
            setStatus('success');
          } else {
            setStatus('error');
          }
        } catch (e) {
          console.error(e);
          setStatus('error');
        }
      } else {
        setStatus('error');
      }
    };

    finalize();
  }, [user, searchParams]);

  return (
    <div className="min-h-screen bg-[#05070A] flex items-center justify-center p-6">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md w-full glass-panel p-10 rounded-[3rem] text-center space-y-8"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto text-cyan-400 animate-spin" size={64} />
            <h2 className="text-2xl font-black italic uppercase tracking-tight">Verifying <span className="text-cyan-400">Transaction</span></h2>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest leading-loose">Synchronizing with payment gateway protocols...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-500 border-4 border-emerald-500/20">
               <CheckCircle size={48} />
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tight">Access <span className="text-emerald-500">Granted</span></h2>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest leading-loose">The knowledge node has been successfully decrypted and unlocked for your terminal.</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-5 bg-emerald-500 rounded-3xl font-black uppercase tracking-[0.2em] text-xs text-black border-4 border-emerald-400/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
            >
               Return to Grid <ArrowRight size={18} />
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-24 h-24 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto text-rose-500 border-4 border-rose-500/20">
               <XCircle size={48} />
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Link <span className="text-rose-500">Severed</span></h2>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest leading-loose">We could not verify your transmission with the Paynow gateway. Please retry or contact support.</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-5 bg-white/5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs text-white border border-white/5 hover:bg-white/10 transition-all"
            >
               Return Home
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
