import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, updateDoc, doc, serverTimestamp, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { useAuth } from '../../AuthContext';
import { FileText, Search, Plus, Send, CheckCircle, Clock, AlertCircle, ChevronRight, X, User, ArrowLeft, Star, Award, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

import BackButton from '../../components/BackButton';

export default function MarkingCenter() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'submitted' | 'returned' | 'all'>('submitted');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  
  // Marking state
  const [markingData, setMarkingData] = useState({ grade: '', feedback: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'submissions'), 
      orderBy('submittedAt', 'desc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const handleReturn = async () => {
    if (!selectedSubmission || !markingData.grade) return;
    setIsSubmitting(true);
    try {
      const subRef = doc(db, 'submissions', selectedSubmission.id);
      await updateDoc(subRef, {
        grade: Number(markingData.grade),
        feedback: markingData.feedback,
        status: 'returned',
        markedAt: serverTimestamp()
      });

      // Send Notification to student
      await addDoc(collection(db, 'notifications'), {
        userId: selectedSubmission.studentUid,
        title: "Assignment Evaluated",
        body: `Your submission for "${selectedSubmission.title || 'Assignment'}" has been marked. Grade: ${markingData.grade}%`,
        type: 'grade',
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setSelectedSubmission(null);
      setMarkingData({ grade: '', feedback: '' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-12 space-y-12 max-w-7xl mx-auto">
      <BackButton to="/admin" label="Exit Teaching Suite" />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-gray-500 font-bold text-xs uppercase tracking-[0.3em]">Teaching Suite</h2>
           <h1 className="text-4xl font-black italic uppercase italic">Marking <span className="text-amber-500">Center</span></h1>
        </div>
        <div className="flex gap-2">
           {['submitted', 'returned', 'all'].map((f) => (
             <button
               key={f}
               onClick={() => setFilter(f as any)}
               className={cn(
                 "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                 filter === f ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-white/5 border-white/5 text-gray-500"
               )}
             >
                {f}
             </button>
           ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredSubmissions.map(sub => (
           <motion.div 
             key={sub.id}
             layoutId={sub.id}
             onClick={() => {
               setSelectedSubmission(sub);
               setMarkingData({ grade: sub.grade || '', feedback: sub.feedback || '' });
             }}
             className={cn(
               "glass-panel p-8 rounded-[2.5rem] bg-white/2 border-white/5 space-y-6 hover:border-amber-500/20 cursor-pointer transition-all group",
               sub.status === 'submitted' ? "border-amber-500/20 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.05)]" : ""
             )}
           >
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500">
                       <User size={24} />
                    </div>
                    <div>
                       <h4 className="text-sm font-black uppercase tracking-tight">{sub.studentName}</h4>
                       <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">{sub.submittedAt ? new Date(sub.submittedAt.toDate()).toLocaleDateString() : 'Just Now'}</p>
                    </div>
                 </div>
                 {sub.status === 'returned' && (
                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[8px] font-black text-emerald-500 uppercase tracking-widest">Marked</div>
                 )}
              </div>
              
              <div className="space-y-1">
                 <h3 className="text-lg font-black italic uppercase italic tracking-tighter line-clamp-1">{sub.title || 'Assignment Submission'}</h3>
                 <p className="text-xs text-gray-500 font-medium line-clamp-2">{sub.textResponse || 'No text response payload.'}</p>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <FileText size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{sub.fileUrls?.length || 0} Artifacts</span>
                 </div>
                 {sub.grade !== undefined && (
                    <div className="flex items-center gap-1">
                       <Star size={10} className="text-amber-500" />
                       <span className="text-lg font-black text-white italic">{sub.grade}%</span>
                    </div>
                 )}
                 {sub.status === 'submitted' && (
                    <div className="flex items-center gap-2 text-amber-500 animate-pulse">
                       <AlertCircle size={14} />
                       <span className="text-[8px] font-black uppercase tracking-widest">Pending Evaluation</span>
                    </div>
                 )}
              </div>
           </motion.div>
         ))}
         {filteredSubmissions.length === 0 && (
            <div className="col-span-full py-40 text-center opacity-20 italic font-bold">
               No submissions in this cognitive sector.
            </div>
         )}
      </div>

      <AnimatePresence>
         {selectedSubmission && (
            <div className="fixed inset-0 z-[150] flex items-stretch md:items-center justify-end md:justify-center bg-[#05070A]/95 backdrop-blur-3xl">
               <motion.div 
                 initial={{ x: 300, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 exit={{ x: 300, opacity: 0 }}
                 className="w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-[3rem] bg-[#0A0C14] border-l md:border border-white/10 flex flex-col md:flex-row overflow-hidden shadow-2xl"
               >
                  {/* Left: Artifact Preview */}
                  <div className="flex-1 overflow-y-auto p-12 bg-white/2 space-y-10 border-r border-white/5">
                     <button onClick={() => setSelectedSubmission(null)} className="md:hidden mb-6 flex items-center gap-2 text-gray-500"><ArrowLeft size={20} /> Back</button>
                     <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Payload Source</span>
                        <h2 className="text-4xl font-black italic uppercase italic leading-tight">{selectedSubmission.title || 'Assignment Alpha'}</h2>
                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-2">
                              <User size={16} className="text-gray-600" />
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedSubmission.studentName}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <Clock size={16} className="text-gray-600" />
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt.toDate()).toLocaleString() : 'N/A'}</span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        {selectedSubmission.textResponse && (
                           <div className="glass-panel p-8 rounded-[2rem] bg-white/5 border-white/5 space-y-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><MessageSquare size={14} /> Text Intelligence</span>
                              <p className="text-lg font-medium leading-relaxed italic">{selectedSubmission.textResponse}</p>
                           </div>
                        )}

                        <div className="space-y-4">
                           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Visual Artifacts ({selectedSubmission.fileUrls?.length || 0})</span>
                           <div className="grid grid-cols-1 gap-4">
                              {selectedSubmission.fileUrls?.map((url: string, i: number) => (
                                <div key={i} className="glass-panel p-2 rounded-[2rem] bg-black/40 border-white/5 overflow-hidden group">
                                   {url.toLowerCase().endsWith('.pdf') ? (
                                      <iframe src={url} className="w-full h-[600px] rounded-2xl" />
                                   ) : (
                                      <img src={url} alt="Artifact" className="w-full rounded-2xl hover:scale-105 transition-all duration-700" />
                                   )}
                                </div>
                              ))}
                              {!selectedSubmission.fileUrls?.length && <div className="p-12 border-2 border-dashed border-white/5 rounded-[2rem] text-center italic text-gray-700">No binary artifacts uploaded.</div>}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Right: Feedback Interface */}
                  <div className="w-full md:w-[400px] bg-black/40 p-12 space-y-12 shrink-0">
                     <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black italic uppercase italic tracking-tighter">Evaluation <span className="text-amber-500">Matrix</span></h3>
                        <button onClick={() => setSelectedSubmission(null)} className="hidden md:block text-gray-600 hover:text-white transition-all"><X size={32} /></button>
                     </div>

                     <div className="space-y-10">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-4">Performance Score (%)</label>
                           <div className="relative">
                              <input 
                                 type="number"
                                 value={markingData.grade}
                                 onChange={e => setMarkingData({...markingData, grade: e.target.value})}
                                 placeholder="100" 
                                 className="w-full bg-[#0A0C14] border border-white/10 p-8 rounded-[2rem] text-5xl font-black text-center focus:border-amber-500 outline-none transition-all placeholder:text-gray-800" 
                              />
                              <div className="absolute top-1/2 -translate-y-1/2 right-10 opacity-20"><Star size={48} /></div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-4">Cognitive Feedback</label>
                           <textarea 
                              value={markingData.feedback}
                              onChange={e => setMarkingData({...markingData, feedback: e.target.value})}
                              placeholder="Provide detailed strategic insights for student development..."
                              className="w-full bg-[#0A0C14] border border-white/10 p-6 rounded-[2rem] text-sm font-bold h-64 focus:border-amber-500 outline-none transition-all resize-none"
                           />
                        </div>

                        <div className="pt-6">
                           <button 
                             disabled={isSubmitting || !markingData.grade}
                             onClick={handleReturn}
                             className="w-full py-6 bg-amber-500 rounded-3xl font-black italic uppercase tracking-[0.3em] text-sm text-black shadow-2xl shadow-amber-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                           >
                              {isSubmitting ? <CheckCircle size={24} className="animate-spin" /> : <><Award size={20} /> Deploy Evaluation</>}
                           </button>
                        </div>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
