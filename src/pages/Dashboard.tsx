import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import { getSubjects, getUserTopics } from '../services/dbService';
import { db, storage } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, where, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Zap, 
  Trophy, 
  BookOpen, 
  ChevronRight, 
  Play, 
  Library, 
  RotateCcw,
  Star,
  Target,
  Award,
  Flame,
  Megaphone,
  Bell,
  MessageSquare,
  Monitor,
  Brain,
  X,
  Send,
  Paperclip,
  Loader2,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, calculateLevel, getProgressToNextLevel, formatXP } from '../lib/utils';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [userTopics, setUserTopics] = useState<any[]>([]);

  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignedVideos, setAssignedVideos] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [learningRequests, setLearningRequests] = useState<any[]>([]);

  // Booking State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSubjectForBooking, setSelectedSubjectForBooking] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({
    topic: '',
    method: 'Platform',
    amount: '',
    name: '',
    phone: '',
    email: ''
  });
  const [bookingFile, setBookingFile] = useState<File | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  // Sync profile into booking form once loaded
  useEffect(() => {
    if (profile) {
      setBookingForm(prev => ({
        ...prev,
        name: prev.name || profile.displayName || '',
        email: profile.email || ''
      }));
    }
  }, [profile]);

  // Submission State
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.email === 'mudzimwapanashe123@gmail.com';

  const handleSubmission = async () => {
    if (!selectedAssignment || !user) return;
    setIsSubmitting(true);
    try {
      const fileUrls = [];
      for (const file of submissionFiles) {
        const sRef = ref(storage, `submissions/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(sRef, file);
        fileUrls.push(await getDownloadURL(sRef));
      }

      await addDoc(collection(db, 'submissions'), {
        studentUid: user.uid,
        studentName: profile?.displayName || profile?.email,
        assignmentId: selectedAssignment.id,
        topicName: selectedAssignment.title,
        textResponse: submissionText,
        fileUrls,
        status: 'submitted',
        submittedAt: serverTimestamp()
      });

      setSelectedAssignment(null);
      setSubmissionText('');
      setSubmissionFiles([]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookingSubmit = async () => {
    if (!selectedSubjectForBooking || !user) return;
    setIsBooking(true);
    try {
      let fileUrl = '';
      if (bookingFile) {
        const sRef = ref(storage, `requests/${user.uid}/${Date.now()}_${bookingFile.name}`);
        await uploadBytes(sRef, bookingFile);
        fileUrl = await getDownloadURL(sRef);
      }

      const requestData = {
        studentUid: user.uid,
        subjectId: selectedSubjectForBooking.id,
        subjectName: selectedSubjectForBooking.name,
        ...bookingForm,
        fileUrl,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'learningRequests'), requestData);

      // WhatsApp Message
      const waMessage = `*New Learning Request*\n\n*Subject:* ${selectedSubjectForBooking.name}\n*Topic:* ${bookingForm.topic}\n*Method:* ${bookingForm.method}\n*Proposed Amount:* $${bookingForm.amount}\n*Student:* ${bookingForm.name}\n*Phone:* ${bookingForm.phone}\n*Gmail:* ${bookingForm.email}\n${fileUrl ? `*File:* ${fileUrl}` : ''}`;
      
      const waUrl = `https://wa.me/263788923630?text=${encodeURIComponent(waMessage)}`;
      window.location.assign(waUrl);

      setShowBookingModal(false);
      setBookingForm({ ...bookingForm, topic: '', amount: '', phone: '' });
      setBookingFile(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsBooking(false);
    }
  };

  useEffect(() => {
    if (user && !isAdmin) {
      Promise.all([
        getSubjects(),
        getUserTopics(user.uid)
      ]).then(([subs, topics]) => {
        setSubjects(subs);
        setUserTopics(topics);
      });



      // Listen for Assignments
      const assignQ = query(collection(db, 'assignments'), where('assignedIds', 'array-contains', user.uid), orderBy('createdAt', 'desc'));
      const unsubAssign = onSnapshot(assignQ, (snap) => {
        setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      // Listen for Assigned Videos
      const videosQ = query(collection(db, 'users', user.uid, 'assignedVideos'), orderBy('assignedAt', 'desc'));
      const unsubVideos = onSnapshot(videosQ, (snap) => {
        setAssignedVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      // Listen for Learning Requests
      const reqQ = query(collection(db, 'learningRequests'), where('studentUid', '==', user.uid), orderBy('createdAt', 'desc'));
      const unsubReq = onSnapshot(reqQ, (snap) => {
        setLearningRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      // Listen for Active Whiteboard Session
      const unsubSession = onSnapshot(doc(db, 'sessions', `session-${user.uid}`), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          // If updated in last 5 minutes, consider it active
          const lastUpdated = data.lastUpdated?.toDate?.() || new Date(0);
          if (new Date().getTime() - lastUpdated.getTime() < 300000) {
            setActiveSession({ id: `session-${user.uid}`, ...data });
          } else {
            setActiveSession(null);
          }
        }
      });

      return () => {

        unsubAssign();
        unsubVideos();
        unsubSession();
      };
    } else {
      setLoading(false);
    }
  }, [user, isAdmin]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#05070A]">
      <div className="text-cyan-400 font-black italic animate-pulse tracking-[0.5em]">CALIBRATING_INTERFACE...</div>
    </div>
  );

  // If Admin, render the Master Protocol Home
  if (isAdmin) {
    return <Admin />;
  }

  if (!profile) return null;

  const level = calculateLevel(profile.xp);
  const progress = getProgressToNextLevel(profile.xp);

  const enrolledSubjects = subjects.filter(s => 
    profile?.enrolledSubjects?.includes(s.id)
  );

  return (
    <div className="p-4 md:p-12 space-y-8 md:space-y-12 max-w-6xl mx-auto pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400/60">System Online</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">Scholars Terminal <span className="text-cyan-400 font-light opacity-80">v4.2</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 glass-panel rounded-2xl flex items-center gap-2 border-orange-500/10">
            <Flame size={16} className="text-orange-500" fill="currentColor" />
            <span className="text-sm font-bold text-orange-500">{profile.streak} Days</span>
          </div>
          <div className="px-4 py-2 glass-panel rounded-2xl flex items-center gap-2 border-cyan-500/10">
            <Zap size={16} className="text-cyan-400" fill="currentColor" />
            <span className="text-sm font-bold text-cyan-400">{formatXP(profile.xp)} XP</span>
          </div>
        </div>
      </header>

      {/* Curriculum Sectors */}
      <section className="space-y-10">
        {['Cambridge', 'ZIMSEC'].map(syllabus => {
          const syllabusSubjects = subjects.filter(s => s.syllabus === syllabus);

          return (
            <div key={syllabus} className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <h3 className={cn(
                  "text-[10px] font-black uppercase tracking-[0.4em]",
                  syllabus === 'Cambridge' ? "text-cyan-400" : "text-emerald-400"
                )}>{syllabus} <span className="opacity-40 font-medium">Sectors</span></h3>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {syllabusSubjects.length > 0 ? syllabusSubjects.map(subject => (
                    <div 
                      key={subject.id}
                      className="glass-card rounded-[2rem] p-5 flex items-center gap-4 group hover:border-cyan-400/30 transition-all border border-white/5"
                    >
                      <Link to={`/discover/${subject.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-all text-2xl flex-shrink-0">
                          {subject.icon || '📚'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{subject.syllabus}</span>
                          </div>
                          <h4 className="font-bold text-white/90 group-hover:text-cyan-400 transition-colors uppercase tracking-tight truncate">{subject.name}</h4>
                          <p className="text-[8px] font-bold text-gray-500/60 uppercase tracking-widest mt-1">Browse Topics</p>
                        </div>
                      </Link>
                      <button
                        onClick={() => { setSelectedSubjectForBooking(subject); setShowBookingModal(true); }}
                        className="flex-shrink-0 px-3 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 rounded-xl text-[8px] font-black uppercase tracking-widest text-cyan-400 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                      >
                        Book
                      </button>
                    </div>
                )) : (
                  <div className="col-span-full py-12 glass-panel rounded-[2rem] text-center border-dashed border-white/10 opacity-30">
                    <p className="text-[9px] font-bold uppercase tracking-widest">No modules initialized in this sector</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>



      {/* Level Card */}
      <section className="glass-panel rounded-[2.5rem] p-10 relative overflow-hidden border-cyan-500/20 shadow-2xl shadow-cyan-500/5">
        <div className="relative z-10 grid md:grid-cols-[1fr_auto] items-end gap-10">
          <div className="space-y-8">
            <div>
              <p className="text-cyan-400 font-bold text-[8px] md:text-[10px] uppercase tracking-[0.4em] mb-4 opacity-70">Scholar Tier Recognition</p>
              <h3 className="text-5xl sm:text-6xl md:text-8xl font-black italic tracking-tighter leading-none text-white/90">RANK {level}</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Mastery Progress</span>
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{Math.round(progress)}% Complete</span>
              </div>
              <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-purple-600 rounded-full shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                />
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
             <div className="w-40 h-40 rounded-full border-2 border-dashed border-cyan-500/20 flex items-center justify-center animate-[spin_20s_linear_infinite]">
                <div className="w-24 h-24 rounded-full border-2 border-cyan-500/40 flex items-center justify-center animate-[spin_10s_linear_infinite_reverse]">
                   <Target size={32} className="text-cyan-400/60" />
                </div>
             </div>
          </div>
        </div>
        
        {/* Background Atmosphere */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] -mr-40 -mt-40 opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] -ml-20 -mb-20 opacity-30 pointer-events-none" />
      </section>

      {/* Online Classroom & Live Lab */}
      <div className="grid lg:grid-cols-2 gap-8">
        {assignedVideos.length > 0 && (
          <section className="space-y-6">
             <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 flex items-center gap-2 px-2">
                <Monitor size={14} className="text-cyan-400" /> Online Classroom
             </h3>
             <div className="grid gap-4">
                {assignedVideos.map((v, i) => (
                  <motion.div 
                    key={v.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] group flex items-center justify-between gap-4 md:gap-6"
                  >
                     <div className="flex items-center gap-3 md:gap-5 min-w-0">
                        <div className="w-10 h-10 md:w-14 md:h-14 shrink-0 rounded-xl md:rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-500">
                           <Play fill="currentColor" size={20} className={cn(v.type === 'video' ? 'block' : 'hidden')} />
                           <BookOpen size={20} className={cn(v.type !== 'video' ? 'block' : 'hidden')} />
                        </div>
                        <div className="min-w-0">
                           <h4 className="font-bold text-sm md:text-lg tracking-tight truncate text-white/90 group-hover:text-cyan-400 transition-colors uppercase">{v.title}</h4>
                           <p className="text-[7px] md:text-[9px] font-bold uppercase text-gray-500 tracking-[0.2em] mt-1">{v.type || 'Data Node'}</p>
                        </div>
                     </div>
                     <a 
                       href={v.url} 
                       target="_blank" 
                       className="px-3 md:px-5 py-2 md:py-3 bg-cyan-500 text-black rounded-lg md:rounded-xl font-bold uppercase text-[7px] md:text-[9px] tracking-widest hover:scale-105 transition-all shadow-lg shadow-cyan-500/20 whitespace-nowrap"
                     >
                       Access
                     </a>
                  </motion.div>
                ))}
             </div>
          </section>
        )}

        <section className="space-y-6">
           <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 flex items-center gap-2 px-2">
              <Brain size={14} className="text-cyan-400" /> Neural Studio
           </h3>
           <div className={`glass-panel p-8 rounded-[2.5rem] border-cyan-500/20 flex flex-col items-center text-center gap-6 relative overflow-hidden group transition-all ${activeSession ? 'bg-cyan-500/[0.08] ring-2 ring-cyan-400' : 'bg-cyan-500/[0.02]'}`}>
              <div className={`w-16 h-16 rounded-[2rem] border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform ${activeSession ? 'bg-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse' : 'bg-cyan-500/10'}`}>
                 <Monitor size={32} />
              </div>
              <div className="space-y-2">
                 <h4 className="text-xl font-bold tracking-tight text-white/90">
                    {activeSession ? 'Live Lab Active' : 'Live Whiteboard Lab'}
                 </h4>
                 <p className="text-xs text-gray-500 leading-relaxed max-w-[240px]">
                    {activeSession ? 'Your tutor has initiated a live neural synchronization.' : 'Synchronize with your curator in the real-time neural workspace.'}
                 </p>
              </div>
              <Link 
                to={`/whiteboard/session-${user.uid}`}
                className={`w-full py-4 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-cyan-500/20 ${activeSession ? 'bg-cyan-400 text-black' : 'bg-cyan-500 text-black'}`}
              >
                {activeSession ? 'Resume Live Stream' : 'Join Creative Stream'}
              </Link>
              
              {activeSession && (
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[8px] font-black uppercase text-cyan-400 tracking-tighter">Live</span>
                </div>
              )}
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] rounded-full -mr-16 -mt-16" />
           </div>
        </section>
      </div>

      {/* Activity & Recognition */}
      <section className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 flex items-center gap-2 px-2">
          <Award size={14} className="text-amber-500" /> Recent Accomplishments
        </h3>
        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 space-y-4 min-h-[200px]">
           {userTopics.length > 0 ? (
             <div className="space-y-3">
               {userTopics.slice(0, 4).map((ut, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                      <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">Node Mastery Achieved</span>
                   </div>
                   <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Validated</span>
                 </div>
               ))}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full gap-5 py-8 opacity-40">
                <div className="p-4 bg-white/5 rounded-full">
                   <RotateCcw size={24} className="text-gray-500" />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-center max-w-[200px] leading-relaxed">Awaiting neural activity to populate achievements</p>
             </div>
           )}
        </div>
      </section>

      {/* Teaching Hub: Assignments & Feedback */}
      <div className="grid lg:grid-cols-2 gap-8">
         {/* Active Assignments */}
         <section className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 flex items-center gap-2 px-2">
               <RotateCcw size={14} className="text-cyan-400" /> Work Modules
            </h3>
            <div className="grid gap-3">
               {assignments.map(a => (
                 <div key={a.id} className="glass-panel p-6 rounded-[2rem] border-cyan-400/10 bg-cyan-400/[0.02] flex items-center justify-between group hover:border-cyan-400/30 transition-all">
                    <div className="min-w-0">
                       <h4 className="font-bold text-white/90 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{a.title}</h4>
                       <div className="flex items-center gap-2 mt-2">
                          <span className="text-[8px] font-bold text-cyan-400/60 uppercase tracking-widest">Target Sync: {a.dueDate?.toDate ? new Date(a.dueDate.toDate()).toLocaleDateString() : 'ASAP'}</span>
                       </div>
                    </div>
                    <button 
                      onClick={() => setSelectedAssignment(a)}
                      className="px-5 py-3 bg-cyan-500 text-black rounded-xl font-bold uppercase text-[9px] tracking-widest hover:scale-105 transition-all shadow-lg shadow-cyan-500/10"
                    >
                      Submit Node
                    </button>
                 </div>
               ))}
               {assignments.length === 0 && (
                 <div className="py-12 glass-panel rounded-[2rem] border-dashed border-white/10 text-center opacity-40">
                    <p className="text-[10px] font-bold uppercase tracking-widest">No pending work found</p>
                 </div>
               )}
            </div>
         </section>
      </div>

      <Link 
        to="/discover" 
        className="block w-full text-center py-6 rounded-[2.5rem] bg-gradient-to-r from-cyan-600 to-purple-700 font-bold uppercase tracking-[0.3em] text-[11px] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-cyan-500/20 relative overflow-hidden group"
      >
        <span className="relative z-10">Initialize Learning Modules Discovery</span>
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
      </Link>

      <AnimatePresence>
        {selectedAssignment && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#05070A]/95 backdrop-blur-2xl">
            <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="w-full max-w-2xl glass-panel p-10 rounded-[3rem] border border-white/10 bg-[#0A0C16] space-y-8"
            >
               <div className="flex justify-between items-center">
                  <h4 className="text-xl font-bold uppercase italic tracking-tight">Work <span className="text-cyan-400">Submission</span></h4>
                  <button onClick={() => setSelectedAssignment(null)} className="text-gray-500 hover:text-white transition-all"><X size={24} /></button>
               </div>

               <div className="space-y-6">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 px-4">Research Summary</label>
                     <textarea 
                        value={submissionText}
                        onChange={e => setSubmissionText(e.target.value)}
                        placeholder="Detail your findings and logical conclusions..." 
                        className="w-full bg-[#05070A] border border-white/10 p-6 rounded-[2rem] text-sm font-bold h-40 focus:border-cyan-400 outline-none transition-all resize-none shadow-inner"
                     />
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 px-4">Binary Artifacts</label>
                     <div className="flex flex-wrap gap-3">
                        {submissionFiles.map((f, i) => (
                           <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
                              <FileText size={14} className="text-cyan-400" />
                              <span className="text-[9px] font-bold uppercase tracking-wider truncate max-w-[120px]">{f.name}</span>
                              <button onClick={() => setSubmissionFiles(submissionFiles.filter((_, idx) => idx !== i))} className="text-rose-500"><X size={12} /></button>
                           </div>
                        ))}
                        <label className="flex items-center gap-2 px-4 py-3 bg-cyan-500/10 border border-dashed border-cyan-500/30 rounded-xl text-cyan-400 cursor-pointer hover:bg-cyan-500/20 transition-all">
                           <Paperclip size={16} />
                           <span className="text-[10px] font-black uppercase tracking-widest">Attach Work</span>
                           <input type="file" multiple className="hidden" onChange={e => {
                              if (e.target.files) setSubmissionFiles([...submissionFiles, ...Array.from(e.target.files)]);
                           }} />
                        </label>
                     </div>
                  </div>
               </div>

               <button 
                 onClick={handleSubmission}
                 disabled={isSubmitting || (!submissionText.trim() && submissionFiles.length === 0)}
                 className="w-full py-6 bg-cyan-500 text-black rounded-3xl font-black italic uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-cyan-400/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
               >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {isSubmitting ? 'Syncing Terminals...' : 'Execute Submission Protocol'}
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && selectedSubjectForBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBookingModal(false)}
              className="absolute inset-0 bg-[#05070A]/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0A0C14] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                 <div className="flex justify-between items-start">
                    <div>
                       <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Book <span className="text-cyan-400">{selectedSubjectForBooking.name}</span></h3>
                       <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-2">Initialize specialized session</p>
                    </div>
                    <button onClick={() => setShowBookingModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500"><X size={20} /></button>
                 </div>

                 <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Learning Target (Topic)</label>
                       <textarea 
                         placeholder="What specific topic do you want to master?"
                         className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-gray-700 outline-none focus:border-cyan-400/30 transition-all min-h-[100px]"
                         value={bookingForm.topic}
                         onChange={e => setBookingForm({...bookingForm, topic: e.target.value})}
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Problem / Question Paper (Optional)</label>
                       <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
                          <Paperclip size={20} className="text-cyan-400" />
                          <input 
                            type="file" 
                            className="text-xs text-gray-500 file:bg-transparent file:border-none file:text-cyan-400 file:font-black file:uppercase file:tracking-widest file:mr-4 file:cursor-pointer"
                            onChange={e => setBookingFile(e.target.files ? e.target.files[0] : null)}
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Method</label>
                          <select 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-cyan-400/30"
                            value={bookingForm.method}
                            onChange={e => setBookingForm({...bookingForm, method: e.target.value})}
                          >
                             <option value="WhatsApp" className="bg-[#0A0C14]">WhatsApp</option>
                             <option value="Platform" className="bg-[#0A0C14]">This Platform</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Amount ($)</label>
                          <input 
                            type="number"
                            placeholder="Amount"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-cyan-400/30"
                            value={bookingForm.amount}
                            onChange={e => setBookingForm({...bookingForm, amount: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Phone Number</label>
                          <input 
                            type="text"
                            placeholder="+263..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-cyan-400/30"
                            value={bookingForm.phone}
                            onChange={e => setBookingForm({...bookingForm, phone: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Gmail Address</label>
                          <input 
                            type="email"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white/50 cursor-not-allowed outline-none"
                            value={bookingForm.email}
                            disabled
                          />
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={handleBookingSubmit}
                   disabled={isBooking || !bookingForm.topic || !bookingForm.amount || !bookingForm.phone}
                   className="w-full py-5 bg-cyan-400 rounded-2xl text-black font-black uppercase italic tracking-[0.3em] text-xs shadow-xl shadow-cyan-400/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                 >
                    {isBooking ? 'Processing Neural Request...' : 'Send Learning Request'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Your Requests Section */}
      {learningRequests.length > 0 && (
        <section className="mt-12 space-y-6">
           <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 flex items-center gap-2 px-2">
              <Star size={14} className="text-cyan-400" /> Pending Synchronizations
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {learningRequests.map(req => (
                <div key={req.id} className="glass-panel p-6 rounded-[2rem] border-white/5 space-y-4">
                   <div className="flex justify-between items-start">
                      <div>
                         <h4 className="font-bold text-white uppercase tracking-tight">{req.subjectName}</h4>
                         <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1">Requested: {new Date(req.createdAt?.toDate()).toLocaleDateString()}</p>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                        req.status === 'accepted' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                      )}>
                        {req.status}
                      </div>
                   </div>
                   <p className="text-[10px] text-gray-400 line-clamp-2 italic">"{req.topic}"</p>
                   {req.status === 'accepted' && (
                     <div className="pt-2">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                           <Zap size={10} fill="currentColor" /> Curator has accepted!
                        </p>
                     </div>
                   )}
                </div>
              ))}
           </div>
        </section>
      )}
    </div>
  );
}
