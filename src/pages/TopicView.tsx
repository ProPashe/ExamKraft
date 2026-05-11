import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  FileText, 
  CheckCircle, 
  Video, 
  Download, 
  BrainCircuit, 
  Timer, 
  ChevronRight,
  ChevronLeft,
  X,
  Trophy,
  ArrowLeft,
  Zap,
  Star,
  Loader2,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  Send,
  User,
  Clock
} from 'lucide-react';
import { getTopics, completeTopic } from '../services/dbService';
import { useAuth } from '../AuthContext';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { 
  doc, 
  updateDoc, 
  increment, 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot,
  query,
  orderBy 
} from 'firebase/firestore';

import BackButton from '../components/BackButton';

export default function TopicView() {
  const { subjectId, topicId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [topic, setTopic] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState<'video' | 'resources' | 'exam' | 'qa'>('video');
  const [examStarted, setExamStarted] = useState(false);
  const [examResults, setExamResults] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);

  // Q&A State
  const [questions, setQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmittingQA, setIsSubmittingQA] = useState(false);

  useEffect(() => {
    if (subjectId && topicId) {
      getTopics(subjectId).then(topics => {
        const found = (topics as any[]).find(t => t.id === topicId);
        setTopic(found);
        if (found?.exam?.timeLimitMinutes) {
          setTimeLeft(found.exam.timeLimitMinutes * 60);
        }
      });

      // Listen for Q&A
      const qaRef = collection(db, 'subjects', subjectId, 'topics', topicId, 'qa');
      const q = query(qaRef, orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => unsubscribe();
    }
  }, [subjectId, topicId]);

  const handlePostQuestion = async () => {
    if (!newQuestion.trim() || !user || !profile || !subjectId || !topicId) return;

    setIsSubmittingQA(true);
    try {
      await addDoc(collection(db, 'subjects', subjectId, 'topics', topicId, 'qa'), {
        userId: user.uid,
        userName: profile.displayName || profile.email,
        question: newQuestion.trim(),
        adminReply: null,
        createdAt: serverTimestamp(),
        repliedAt: null
      });
      setNewQuestion('');
    } catch (e) {
      console.error("QA Post Error:", e);
    } finally {
      setIsSubmittingQA(false);
    }
  };

  useEffect(() => {
    let timer: any;
    if (examStarted && timeLeft > 0 && !examResults) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && examStarted && !examResults) {
      submitExam();
    }
    return () => clearInterval(timer);
  }, [examStarted, timeLeft, examResults]);

  const submitExam = async () => {
    const questions = (topic as any).exam.questions;
    let score = 0;
    questions.forEach((q: any, i: number) => {
      const userAnswer = answers[i]?.toString().trim().toLowerCase();
      if (q.type === 'mcq') {
        if (answers[i] === q.correctAnswer) score++;
      } else if (q.type === 'short') {
        const modelAnswer = q.modelAnswer?.toString().trim().toLowerCase();
        if (userAnswer === modelAnswer) score++;
      }
    });
    
    const percentage = (score / questions.length) * 100;
    const passed = percentage >= (topic as any).exam.passingPercentage;

    setExamResults({
      score,
      total: questions.length,
      percentage,
      passed
    });

    if (passed && user) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00F2FF', '#A855F7', '#FFD700']
      });

      await completeTopic(user.uid, topicId!, percentage);
    }
    
    setShowExamModal(false);
  };

  if (!topic) return <div className="h-screen flex items-center justify-center bg-[#05070A] text-cyan-400 font-black italic">SYNCHRONIZING DATA...</div>;

  return (
    <div className="min-h-screen bg-[#05070A] text-white flex flex-col">
      {/* Top Protocol Bar */}
      <header className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl sticky top-0 z-[100]">
        <BackButton to={`/discover/${subjectId}`} label="Exit Node" />
        <div className="text-center">
            <p className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.4em]">Active Module</p>
            <h1 className="font-black italic uppercase tracking-tighter text-lg">{topic.title}</h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden md:flex flex-col items-end">
              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Progress</p>
              <div className="flex gap-1">
                 {[1,2,3].map(i => (
                    <div key={i} className={cn("w-3 h-1 rounded-full", i === 1 ? "bg-cyan-400" : "bg-white/10")} />
                 ))}
              </div>
           </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row divide-x divide-white/5 overflow-hidden">
        {/* Middle Col: Primary Hub */}
        <div className="flex-1 flex flex-col h-full bg-black/20 overflow-hidden">
          {/* Tab Navigation */}
          <nav className="flex items-center px-6 border-b border-white/5 bg-black/20 backdrop-blur-md">
            {[
              { id: 'video', label: 'Instruction', icon: Play },
              { id: 'resources', label: 'Data Banks', icon: FileText },
              { id: 'exam', label: 'Evaluation', icon: Zap },
              { id: 'qa', label: 'Relay (Q&A)', icon: MessageSquare }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                className={cn(
                  "px-6 py-5 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all relative border-b-2",
                  currentTab === tab.id 
                    ? "text-cyan-400 border-cyan-400" 
                    : "text-gray-500 border-transparent hover:text-gray-300"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 scrollbar-hide">
            {currentTab === 'video' && (
              <div className="space-y-10">
                <div className="aspect-video glass-panel rounded-[2rem] overflow-hidden relative glow-cyan shadow-2xl">
                  <iframe 
                      className="w-full h-full"
                      src={topic.videoUrl}
                      title={topic.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                  />
                </div>
                
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => setShowExamModal(true)}
                        className="px-8 py-5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl font-black italic uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl shadow-cyan-500/20 active:scale-95 transition-all"
                      >
                        <Zap size={16} fill="currentColor" /> Initialize Assessment
                      </button>
                  </div>

                  <div className="p-8 glass-panel rounded-[2.5rem] border-white/5 space-y-4">
                      <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest">Protocol Intelligence</h3>
                      <p className="text-gray-400 font-medium leading-relaxed">
                        {topic.description || "Mastering this module provides critical infrastructure for advanced subject comprehension. Ensure total focus during the simulation."}
                      </p>
                  </div>
                </div>
              </div>
            )}

            {currentTab === 'resources' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                   <h3 className="text-3xl font-black italic uppercase">Resource <span className="text-emerald-400">Vault</span></h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                   {topic.resources?.length > 0 ? topic.resources.map((res: any, idx: number) => (
                      <div key={idx} className="p-6 bg-[#0A0C14] rounded-[2rem] border border-white/5 flex items-center justify-between hover:border-emerald-500/30 transition-all group">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                              <FileText size={24} className="text-emerald-400" />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-sm font-bold truncate max-w-[200px] uppercase font-black">{res.name}</span>
                               <span className="text-[8px] uppercase font-black text-gray-500">Encrypted Data Stream</span>
                            </div>
                         </div>
                         <a href={res.url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-emerald-500 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                            Download
                         </a>
                      </div>
                   )) : (
                      <div className="col-span-2 py-32 text-center glass-panel rounded-[3rem] opacity-30 italic font-bold">
                        No external data banks identified in this sector.
                      </div>
                   )}
                </div>
              </div>
            )}

            {currentTab === 'exam' && (
               <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-10 max-w-2xl mx-auto">
                  <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                     <BrainCircuit size={48} className="text-purple-500" />
                  </div>
                  <h2 className="text-4xl font-black italic uppercase italic tracking-tighter">Evaluation <span className="text-purple-500">Protocol</span></h2>
                  <p className="text-gray-400 font-medium leading-relaxed">
                    Complete the assessment module to synchronize mastery data. A score of {topic.exam.passingPercentage}% is required for node validation.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 p-8 glass-panel rounded-[2rem] border-white/5">
                     <div className="text-center space-y-1">
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Question Count</p>
                        <p className="text-2xl font-black italic">{topic.exam.questions.length}</p>
                     </div>
                     <div className="text-center space-y-1">
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Time Constraint</p>
                        <p className="text-2xl font-black italic text-cyan-400">{topic.exam.timeLimitMinutes}m 00s</p>
                     </div>
                  </div>

                  <button 
                    onClick={() => setShowExamModal(true)}
                    className="w-full py-6 bg-purple-600 rounded-3xl font-black italic uppercase tracking-[0.2em] text-sm shadow-2xl shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Engage Assessment Module
                  </button>
               </div>
            )}

            {currentTab === 'qa' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Ask a Question */}
                <div className="glass-panel p-8 rounded-[2.5rem] bg-[#0A0C14] border-white/5 space-y-6">
                   <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-widest text-cyan-400">Knowledge Relay</h4>
                      <div className="flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[8px] font-black uppercase text-gray-500">Comm-Link: Active</span>
                      </div>
                   </div>
                   <div className="relative">
                      <textarea 
                        value={newQuestion}
                        onChange={e => setNewQuestion(e.target.value)}
                        placeholder="Transmit your query to the master curator..."
                        className="w-full bg-white/2 border border-white/5 p-6 rounded-[1.5rem] text-sm font-bold min-h-[120px] outline-none focus:border-cyan-400 transition-all placeholder:text-gray-700"
                      />
                      <button 
                        onClick={handlePostQuestion}
                        disabled={isSubmittingQA || !newQuestion.trim()}
                        className="absolute bottom-4 right-4 px-6 py-3 bg-cyan-500 rounded-xl text-white font-black uppercase text-[8px] tracking-widest flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:grayscale transition-all"
                      >
                         {isSubmittingQA ? <Loader2 size={12} className="animate-spin" /> : <><Send size={12} /> Post Query</>}
                      </button>
                   </div>
                </div>

                {/* Conversation Stream */}
                <div className="space-y-6">
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <Clock size={12} /> Synchronized Intelligence Log
                   </h5>
                   
                   <div className="space-y-4">
                      {questions.length > 0 ? questions.map((qa) => (
                        <div key={qa.id} className="space-y-3">
                           {/* Question */}
                           <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                 <User size={18} className="text-gray-500" />
                              </div>
                              <div className="glass-panel p-6 rounded-2xl rounded-tl-none bg-[#0A0C14] border-white/5 flex-1 relative">
                                 <p className="text-sm font-bold leading-relaxed">{qa.question}</p>
                                 <div className="mt-3 flex items-center gap-2">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">{qa.userName}</span>
                                    <span className="w-0.5 h-0.5 rounded-full bg-gray-700" />
                                    <span className="text-[8px] font-bold text-gray-700">{qa.createdAt ? new Date(qa.createdAt.toDate?.()).toLocaleTimeString() : 'Recent'}</span>
                                 </div>
                              </div>
                           </div>

                           {/* Reply */}
                           {qa.adminReply ? (
                              <div className="flex items-start gap-4 flex-row-reverse">
                                 <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                                    <Star size={18} className="text-cyan-400" />
                                 </div>
                                 <div className="glass-panel p-6 rounded-2xl rounded-tr-none bg-cyan-500/5 border-cyan-500/20 flex-1 relative text-right">
                                    <p className="text-sm font-bold italic text-cyan-100 leading-relaxed">{qa.adminReply}</p>
                                    <div className="mt-3 flex items-center gap-2 justify-end">
                                       <span className="text-[8px] font-bold text-cyan-950">{qa.repliedAt ? new Date(qa.repliedAt.toDate?.()).toLocaleTimeString() : 'Recent'}</span>
                                       <span className="w-0.5 h-0.5 rounded-full bg-cyan-900" />
                                       <span className="text-[8px] font-black uppercase tracking-widest text-cyan-400">Master Curator Response</span>
                                    </div>
                                 </div>
                              </div>
                           ) : (
                              <div className="pl-14">
                                 <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 italic">Awaiting response from master stream...</span>
                              </div>
                           )}
                        </div>
                      )) : (
                        <div className="py-20 text-center glass-panel rounded-[3rem] border-dashed border-white/10 opacity-20 italic font-bold">
                           No communication packets detected in local space.
                        </div>
                      )}
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Tactical Sidebar */}
        <div className="w-full lg:w-[380px] bg-black/40 backdrop-blur-xl flex flex-col">
          <div className="p-8 flex-1 space-y-10 overflow-y-auto scrollbar-hide">
             <div className="space-y-6">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Module Index</h3>
                <div className="space-y-3">
                   {['Watch Lesson', 'Study Resources', 'Final Exam'].map((task, i) => (
                      <div key={i} className="group p-4 glass-panel rounded-2xl border-white/5 flex items-center justify-between hover:border-cyan-500/30 transition-all cursor-pointer">
                         <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black italic text-gray-600 group-hover:text-cyan-400 transition-colors">0{i+1}</span>
                            <span className="text-sm font-bold opacity-80">{task}</span>
                         </div>
                         {i === 0 ? <CheckCircle2 size={16} className="text-emerald-500" /> : <div className="w-2 h-2 rounded-full bg-white/5" />}
                      </div>
                   ))}
                </div>
             </div>

             <div className="p-6 glass-panel rounded-3xl bg-cyan-500/5 border-cyan-500/10 space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Mastery Status</h3>
                   <Star size={16} className="text-cyan-400 animate-pulse" />
                </div>
                <div className="flex items-end justify-between">
                   <span className="text-4xl font-black italic">{examResults ? '100' : '0'}<span className="text-lg opacity-40">%</span></span>
                   <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter mb-2">Efficiency Rating</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className={cn("h-full bg-cyan-400 glow-cyan transition-all duration-1000", examResults ? "w-full" : "w-0")} />
                </div>
             </div>
          </div>

          <div className="p-8 border-t border-white/5">
             <button className="w-full py-4 glass-panel rounded-2xl font-black italic uppercase tracking-[0.2em] text-[10px] text-gray-500 hover:text-white transition-all">Submit Protocol Log</button>
          </div>
        </div>
      </main>

      {/* Exam Overlay Modal */}
      <AnimatePresence>
        {showExamModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#05070A]/95 backdrop-blur-2xl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-2xl rounded-[3rem] p-12 border-white/10 space-y-10"
            >
              <div className="text-center space-y-3">
                 <h2 className="text-3xl font-black italic italic uppercase tracking-tighter">Assessment <span className="text-cyan-400">Simulation</span></h2>
                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Required Accuracy: {topic.exam.passingPercentage}%</p>
              </div>

              <div className="space-y-12 max-h-[50vh] overflow-y-auto pr-6 scrollbar-hide">
                {topic.exam.questions.map((q: any, i: number) => (
                  <div key={i} className="space-y-6">
                    <h4 className="text-xl font-bold flex gap-4">
                       <span className="text-cyan-400 font-black italic">0{i+1}</span>
                       {q.questionText}
                    </h4>
                    <div className="grid gap-3">
                       {q.type === 'mcq' ? (
                           q.options.map((opt: string) => (
                             <button 
                               key={opt}
                               onClick={() => setAnswers({...answers, [i]: opt})}
                               className={cn(
                                 "w-full text-left p-5 rounded-[1.25rem] border-2 transition-all font-bold text-sm",
                                 answers[i] === opt ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 glow-cyan" : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                               )}
                             >
                               {opt}
                             </button>
                           ))
                       ) : (
                          <textarea 
                             value={answers[i] || ''}
                             onChange={e => setAnswers({...answers, [i]: e.target.value})}
                             placeholder="Node Response String..."
                             className="w-full bg-white/5 border-2 border-white/5 p-5 rounded-[1.25rem] text-white font-bold outline-none focus:border-cyan-500 transition-all h-32"
                          />
                       )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setShowExamModal(false)} className="flex-1 py-5 glass-panel rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-500 hover:text-white transition-all">Abort Simulation</button>
                 <button onClick={submitExam} className="flex-1 py-5 bg-cyan-500 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl shadow-cyan-500/20 active:scale-95 transition-all">Submit Final</button>
              </div>
            </motion.div>
          </div>
        )}

        {examResults && (
           <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-[#05070A]/95 backdrop-blur-3xl">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center space-y-10"
              >
                <div className={cn(
                  "w-32 h-32 rounded-full flex items-center justify-center border-8 mx-auto animate-bounce",
                  examResults.passed ? "border-emerald-500 bg-emerald-500/20" : "border-rose-500 bg-rose-500/20"
                )}>
                  {examResults.passed ? <CheckCircle2 size={64} className="text-emerald-500" /> : <AlertTriangle size={64} className="text-rose-500" />}
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-5xl font-black italic uppercase tracking-tighter">{examResults.passed ? 'Objective Captured' : 'Simulation Terminated'}</h2>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Evaluation Score: {examResults.percentage}%</p>
                </div>

                <div className="flex gap-6 justify-center">
                  <button onClick={() => setExamResults(null)} className="px-10 py-5 glass-panel rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all">Review Log</button>
                  <Link to={`/discover/${subjectId}`} className="px-10 py-5 bg-cyan-500 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl shadow-cyan-500/20 active:scale-95 transition-all">Proceed to Next</Link>
                </div>
              </motion.div>
           </div>
        )}

        {showResourcesModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#05070A]/95 backdrop-blur-2xl">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="glass-panel w-full max-w-lg rounded-[2.5rem] p-10 border-white/10 space-y-8"
             >
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black italic uppercase">Resource <span className="text-emerald-400">Bank</span></h3>
                   <button onClick={() => setShowResourcesModal(false)}><X size={24} /></button>
                </div>
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
                   {topic.resources?.length > 0 ? topic.resources.map((res: any, idx: number) => (
                      <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between hover:border-emerald-500/30 transition-all group">
                         <div className="flex items-center gap-4">
                            <FileText size={20} className="text-emerald-400" />
                            <div className="flex flex-col">
                               <span className="text-sm font-bold truncate max-w-[200px]">{res.name}</span>
                               <span className="text-[8px] uppercase font-black text-gray-500">Manual Entry</span>
                            </div>
                         </div>
                         <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <Download size={16} />
                         </a>
                      </div>
                   )) : (
                      <div className="py-10 text-center opacity-30 italic font-bold">No external data banks identified.</div>
                   )}
                </div>
                <button onClick={() => setShowResourcesModal(false)} className="w-full py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all">Close Console</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
