import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../AuthContext';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  setDoc, 
  doc, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy,
  limit,
  collectionGroup,
  onSnapshot,
  where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Award, 
  Settings, 
  Plus, 
  Trash2, 
  Edit2, 
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  ShieldCheck,
  Search,
  ArrowRight,
  Filter,
  Menu,
  ChevronRightIcon,
  Star,
  Monitor,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  MessageSquare
} from 'lucide-react';


import { cn } from '../lib/utils';
import AdminChat from './AdminChat';


export default function Admin() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = (searchParams.get('tab') as any) || 'home';
  const [activeTab, setActiveTab] = useState<any>(initialTab);

  useEffect(() => {
    const handlePopState = () => {
      const tab = new URLSearchParams(window.location.search).get('tab') || 'home';
      setActiveTab(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab') || 'home';
    setActiveTab(tab);
  }, [window.location.search]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
  const [showStudentAction, setShowStudentAction] = useState<{ type: string, students: any[] } | null>(null);

  // Data State
  const [subjects, setSubjects] = useState<any[]>([]);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const [learningRequests, setLearningRequests] = useState<any[]>([]);
  


  // Modals
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  // Form State
  const [newSubject, setNewSubject] = useState({ name: '', level: 'O-Level', syllabus: 'Cambridge', icon: '📐', color: '#3b82f6', description: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [newTopic, setNewTopic] = useState({ name: '', description: '', videoUrl: '' });


  useEffect(() => {
    fetchAllData();

    // Listen for Learning Requests
    const reqQ = query(collection(db, 'learningRequests'), orderBy('createdAt', 'desc'));
    const unsubReq = onSnapshot(reqQ, (snap) => {
      setLearningRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubReq();
    };
  }, []);

  const seedSubjects = async () => {
    setLoading(true);
    const subjectsToSeed = [
      // Cambridge O-Level
      { name: 'Additional Maths', level: 'O-Level', syllabus: 'Cambridge', icon: '📐', color: '#3b82f6', description: 'Advanced mathematical concepts and calculus.' },
      { name: 'Pure Maths', level: 'O-Level', syllabus: 'Cambridge', icon: '📊', color: '#8b5cf6', description: 'Fundamental mathematical principles.' },
      { name: 'Computer Science', level: 'O-Level', syllabus: 'Cambridge', icon: '💻', color: '#f59e0b', description: 'Introduction to algorithms and programming.' },
      
      // ZIMSEC O-Level
      { name: 'General Maths', level: 'O-Level', syllabus: 'ZIMSEC', icon: '➕', color: '#10b981', description: 'Core mathematics foundation.' },
      { name: 'Geography', level: 'O-Level', syllabus: 'ZIMSEC', icon: '🌍', color: '#ef4444', description: 'Physical and human geography.' },
      
      // Cambridge A-Level
      { name: 'Pure Maths', level: 'A-Level', syllabus: 'Cambridge', icon: '📊', color: '#8b5cf6', description: 'Advanced pure mathematics.' },
      { name: 'Computer Science', level: 'A-Level', syllabus: 'Cambridge', icon: '💻', color: '#f59e0b', description: 'System design and data structures.' },
      
      // ZIMSEC A-Level
      { name: 'Application Development', level: 'A-Level', syllabus: 'ZIMSEC', icon: '📱', color: '#ec4899', description: 'Practical software creation.' },
      { name: 'Geography', level: 'A-Level', syllabus: 'ZIMSEC', icon: '🌍', color: '#ef4444', description: 'In-depth geographical studies.' },
    ];

    try {
      for (const subject of subjectsToSeed) {
        const exists = subjects.find(s => s.name === subject.name && s.level === subject.level && s.syllabus === subject.syllabus);
        if (!exists) {
          await addDoc(collection(db, 'subjects'), {
            ...subject,
            createdAt: serverTimestamp(),
            topicsCount: 0
          });
        }
      }
      await fetchAllData();
      setStatus({ type: 'success', message: "Curriculum sectors synchronized successfully." });
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  };
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [subsSnap, studentsSnap, transSnap] = await Promise.all([
        getDocs(collection(db, 'subjects')),
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc')))
      ]);

      const subs = subsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setSubjects(subs);
      
      const allUsers = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(allUsers.filter((u: any) => u.role === 'student' || !u.role));
      setRecentRegistrations(allUsers.slice(0, 5));

      const trans = transSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(trans);

      // Fetch all topics
      const allT: any[] = [];
      for (const s of subs) {
        const tsSnap = await getDocs(collection(db, 'subjects', s.id, 'topics'));
        tsSnap.docs.forEach(t => allT.push({ id: t.id, subjectId: s.id, subjectName: s.name, ...t.data() }));
      }
      setAllTopics(allT);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTopic = async () => {
    if (!selectedSubject || !newTopic.name) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'subjects', selectedSubject.id, 'topics'), {
        ...newTopic,
        createdAt: serverTimestamp(),
        order: (allTopics.filter(t => t.subjectId === selectedSubject.id).length || 0) + 1
      });
      await fetchAllData();
      setShowTopicModal(false);
      setNewTopic({ name: '', description: '', videoUrl: '' });
      setStatus({ type: 'success', message: "Topic synthesized and synced." });
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  };


  const sidebarLinks = [
    { id: 'home', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'subjects', icon: BookOpen, label: 'Subjects' },
    { id: 'requests', icon: Star, label: 'Learning Requests' },
    { id: 'chat', icon: MessageSquare, label: 'Student Chat' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'learningRequests', requestId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });
      setStatus({ type: 'success', message: "Neural synchronization request accepted." });
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message });
    }
  };

  // Elevation Utility logic
  const handleElevate = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const response = await fetch('/api/admin/elevate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: profile.uid, email: profile.email })
      });
      const data = await response.json();
      if (data.success) {
          setStatus({ type: 'success', message: data.message });
          setTimeout(() => window.location.reload(), 2000);
      } else {
          setStatus({ type: 'error', message: data.message });
      }
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#020408] text-white font-sans">
      {/* Sidebar merged into App.tsx */}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative">
         {/* Top Bar */}
         <header className="h-20 border-b border-white/5 bg-[#0A0C16]/40 backdrop-blur-2xl px-8 flex items-center justify-between z-50">
            <div className="flex items-center gap-6">
               <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2.5 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5">
                  <Menu size={20} />
               </button>
               <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
               <h3 className="text-xl font-bold tracking-tight text-white/90">
                  {sidebarLinks.find(l => l.id === activeTab)?.label}
               </h3>
            </div>
            
            <div className="flex items-center gap-8">
               <div className="hidden md:flex flex-col text-right">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400 opacity-70 mb-0.5">Master Curator</span>
                  <span className="text-xs font-semibold text-gray-500">{profile?.email}</span>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 p-[1px] group cursor-pointer">
                  <div className="w-full h-full rounded-[0.95rem] bg-[#0A0C16] flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-cyan-400/50 transition-colors">
                     {profile?.avatar ? <img src={profile.avatar} alt="Admin" className="w-full h-full object-cover" /> : <ShieldCheck className="text-cyan-400/80" size={22} />}
                  </div>
               </div>
            </div>
         </header>

         {/* Content Scroll Container */}
         <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
            {status && (
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={cn("p-4 rounded-2xl border flex items-center gap-3", status.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500")}
              >
                {status.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                <span className="text-sm font-bold">{status.message}</span>
                <button onClick={() => setStatus(null)} className="ml-auto p-1 hover:bg-black/10 rounded-full transition-all"><X size={16} /></button>
              </motion.div>
            )}

            {activeTab === 'home' && (
              <div className="space-y-12 pb-20">


                  {/* Quick Access & Master Protocols */}
                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                       <div className="glass-panel p-10 rounded-[3rem] bg-gradient-to-br from-cyan-500/[0.05] to-purple-500/[0.05] border-white/10 space-y-8 h-full">
                          <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400">Master Protocols</h4>
                          <div className="space-y-4">
                             <QuickActionButton label="Deploy Subject" icon={Plus} onClick={() => setActiveTab('subjects')} />
                             <QuickActionButton label="Audit Grid Logs" icon={Search} onClick={() => setActiveTab('students')} />
                          </div>
                       </div>
                    </div>
                  </div>

                 {/* Recent Registrations Table */}
                 <div className="glass-panel rounded-[3rem] bg-[#0A0C16] border-white/5 overflow-hidden shadow-2xl">
                    <div className="p-10 border-b border-white/5 flex items-center justify-between">
                       <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-cyan-400/80">Neural Grid Log</h4>
                          <p className="text-xs font-semibold text-gray-500 mt-2">Latest Student Synchronizations</p>
                       </div>
                       <button onClick={() => setActiveTab('students')} className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:text-white transition-colors underline underline-offset-8">Intelligence Stream</button>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead className="bg-white/[0.02]">
                             <tr className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-500">
                                <th className="px-10 py-6">Intelligence Spec</th>
                                <th className="px-10 py-6">Sector Placement</th>
                                <th className="px-10 py-6">Neural Level</th>
                                <th className="px-10 py-6">Synced At</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                             {recentRegistrations.map((stu, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-all group">
                                   <td className="px-10 py-6">
                                      <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold group-hover:scale-110 transition-transform border border-cyan-500/20">
                                            {stu.displayName?.charAt(0) || '?'}
                                         </div>
                                         <div className="flex flex-col">
                                            <span className="text-sm font-bold tracking-tight">{stu.displayName}</span>
                                            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tight">{stu.email}</span>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-10 py-6">
                                      <span className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[9px] font-bold uppercase text-gray-500 tracking-wider">O-LEVEL INTEL</span>
                                   </td>
                                   <td className="px-10 py-6">
                                      <div className="flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                         <span className="text-xs font-bold text-cyan-400 uppercase tracking-tighter">LVL {stu.level || 1}</span>
                                      </div>
                                   </td>
                                   <td className="px-10 py-6 text-[11px] font-medium text-gray-500 tracking-tight">
                                      {stu.createdAt ? new Date(stu.createdAt.toDate?.() || Date.now()).toLocaleDateString('en-GB') : 'N/A'}
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'subjects' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                       <h2 className="text-4xl font-bold tracking-tight">Curriculum <span className="text-purple-400 font-light italic">Forge</span></h2>
                       <p className="text-gray-500 text-[11px] font-bold uppercase tracking-[0.4em] mt-2 opacity-60">Knowledge node architecture</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <button 
                         onClick={seedSubjects}
                         className="px-8 py-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-2xl font-bold uppercase text-[11px] tracking-[0.2em] border border-emerald-500/20 transition-all flex items-center gap-3">
                          <RotateCcw size={18} /> Sync Curriculum
                       </button>
                       <button 
                         onClick={() => setShowSubjectModal(true)}
                         className="px-8 py-4 bg-purple-600/90 hover:bg-purple-600 rounded-2xl font-bold uppercase text-[11px] tracking-[0.2em] text-white shadow-2xl shadow-purple-900/30 active:scale-95 transition-all flex items-center gap-3 backdrop-blur-xl border border-white/10">
                          <Plus size={18} /> Add Target Subject
                       </button>
                    </div>
                 </div>

                 <div className="space-y-16">
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

                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                              {syllabusSubjects.map(subject => (
                                 <div key={subject.id} className="group glass-card p-10 rounded-[3rem] bg-[#0A0C16] border-white/5 hover:border-purple-500/30 transition-all duration-500 flex flex-col justify-between h-[320px] relative overflow-hidden">
                                    <div className="space-y-8 relative z-10">
                                       <div className="flex justify-between items-start">
                                          <div className="w-16 h-16 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center justify-center text-5xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-700">
                                            {subject.icon}
                                          </div>
                                          <div className="flex flex-col text-right">
                                             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-purple-400 mb-1">{subject.syllabus}</span>
                                             <span className="text-[11px] font-semibold text-gray-500">{subject.level}</span>
                                          </div>
                                       </div>
                                       <div className="space-y-2">
                                          <h3 className="text-2xl font-bold tracking-tight text-white/90 group-hover:text-white transition-colors">{subject.name}</h3>
                                          <p className="text-[11px] font-medium text-gray-500 line-clamp-2 uppercase leading-relaxed tracking-wide">{subject.description || 'No sectoral decryption found.'}</p>
                                       </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-8 border-t border-white/5 relative z-10">
                                       <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
                                          <span className="text-purple-400">{subject.topicsCount || 0}</span> Modules Synced
                                       </div>
                                       <div className="flex gap-2">
                                          <button 
                                            onClick={() => { setSelectedSubject(subject); setShowTopicModal(true); }}
                                            className="p-2.5 bg-purple-500/20 hover:bg-purple-500/40 rounded-xl transition-all border border-purple-500/20"
                                            title="Add Topic"
                                          >
                                            <Plus size={16} className="text-purple-400" />
                                          </button>
                                          <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"><Edit2 size={16} className="text-gray-400" /></button>
                                          <button className="p-2.5 bg-rose-500/10 hover:bg-rose-500 rounded-xl group/del transition-all border border-rose-500/10 focus:ring-2 ring-rose-500/20"><Trash2 size={16} className="text-rose-500 group-hover/del:text-white" /></button>
                                          <button className="p-2.5 bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/20 active:scale-90 transition-all border border-white/5"><ArrowRight size={16} /></button>
                                       </div>
                                    </div>
                                    
                                    {/* Card Glow */}
                                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full -mr-16 -mb-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                 </div>
                              ))}
                              {syllabusSubjects.length === 0 && (
                                <div className="col-span-full py-16 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30">
                                  <p className="text-xs font-bold uppercase tracking-[0.4em]">No subjects initialized in this sector</p>
                                </div>
                              )}
                           </div>
                        </div>
                      );
                    })}
                 </div>
               </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="flex justify-between items-end px-2">
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-400 mb-2">Master Booking Archive</p>
                       <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">Learning <span className="text-purple-500">Requests</span></h2>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="px-5 py-2.5 glass-panel rounded-2xl border-white/5 flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{learningRequests.filter(r => r.status === 'pending').length} Pending Requests</span>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    {learningRequests.map(req => (
                      <div key={req.id} className="glass-card p-8 rounded-[2.5rem] bg-[#0A0C16] border-white/5 hover:border-cyan-400/20 transition-all space-y-6">
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl">
                                  📚
                               </div>
                               <div>
                                  <h4 className="font-bold text-white text-lg">{req.subjectName}</h4>
                                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{req.method} Session • {new Date(req.createdAt?.toDate()).toLocaleDateString()}</p>
                               </div>
                            </div>
                            <div className={cn(
                              "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                              req.status === 'accepted' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            )}>
                              {req.status}
                            </div>
                         </div>

                         <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/5 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Request Details</p>
                            <p className="text-sm text-gray-300 italic">"{req.topic}"</p>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Proposed Amount</p>
                               <p className="text-xl font-black text-emerald-400 italic">${req.amount}</p>
                            </div>
                            <div className="space-y-1 text-right">
                               <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Student Link</p>
                               <p className="text-xs font-bold text-white/80">{req.name}</p>
                               <p className="text-[10px] text-gray-500">{req.phone}</p>
                            </div>
                         </div>

                         {req.fileUrl && (
                           <a 
                             href={req.fileUrl} 
                             target="_blank" 
                             className="flex items-center gap-3 p-4 bg-cyan-400/5 hover:bg-cyan-400/10 rounded-2xl border border-cyan-400/10 transition-all group"
                           >
                              <Paperclip size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">View Problem Paper</span>
                           </a>
                         )}

                         {req.status === 'pending' && (
                           <button 
                             onClick={() => handleAcceptRequest(req.id)}
                             className="w-full py-4 bg-cyan-500 text-black rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-lg shadow-cyan-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                           >
                              Accept Synchrony
                           </button>
                         )}
                      </div>
                    ))}
                    {learningRequests.length === 0 && (
                      <div className="col-span-full py-20 text-center glass-panel rounded-[3rem] border-dashed border-white/10 opacity-30">
                         <p className="text-sm font-black uppercase tracking-[0.4em]">No learning requests in archive</p>
                      </div>
                    )}
                 </div>
              </div>
            )}

             
            {activeTab === 'chat' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <AdminChat students={students} />
              </div>
            )}










         </div>
         </main>

      {/* Shared Modals */}
       <AnimatePresence>
          {showTopicModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm pointer-events-none">
              <motion.div 
                drag
                dragMomentum={false}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-xl glass-panel p-10 rounded-[3rem] border border-white/10 bg-[#0A0C16] space-y-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] pointer-events-auto cursor-default"
              >
                <div className="flex justify-between items-center cursor-move">
                  <div>
                    <h4 className="text-2xl font-bold tracking-tight">Add Syllabus <span className="text-purple-400">Topic</span></h4>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Modular Node Synthesizer</p>
                  </div>
                  <button onClick={() => setShowTopicModal(false)} className="text-gray-500 hover:text-white transition-all"><X size={24} /></button>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 scrollbar-hide">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 px-4">Target Subject</label>
                    <select 
                      value={selectedSubject?.id}
                      onChange={e => setSelectedSubject(subjects.find(s => s.id === e.target.value))}
                      className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-sm font-bold focus:border-purple-500 outline-none transition-all appearance-none text-white"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#0A0C16]">{s.name} ({s.level})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 px-4">Topic Title</label>
                    <input 
                      type="text" 
                      value={newTopic.name}
                      onChange={e => setNewTopic({...newTopic, name: e.target.value})}
                      placeholder="e.g. Differential Calculus" 
                      className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-sm font-bold focus:border-purple-500 outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 px-4">Description</label>
                    <textarea 
                      value={newTopic.description}
                      onChange={e => setNewTopic({...newTopic, description: e.target.value})}
                      placeholder="Summary of the topic modules..." 
                      className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-sm font-bold h-32 focus:border-purple-500 outline-none transition-all resize-none" 
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 px-4">Video Link (Optional)</label>
                    <input 
                      type="text" 
                      value={newTopic.videoUrl}
                      onChange={e => setNewTopic({...newTopic, videoUrl: e.target.value})}
                      placeholder="YouTube or Vimeo URL" 
                      className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-sm font-bold focus:border-purple-500 outline-none transition-all" 
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAddTopic}
                  disabled={loading || !newTopic.name}
                  className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black italic uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-purple-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  Synthesize Node
                </button>
              </motion.div>
            </div>
          )}
       </AnimatePresence>
    </div>
  );
}



function QuickActionButton({ label, icon: Icon, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-6 bg-white/[0.02] rounded-[1.5rem] border border-white/5 hover:border-cyan-400/30 hover:bg-white/[0.05] transition-all duration-500 group relative overflow-hidden">
       <div className="flex items-center gap-5 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center text-gray-500 group-hover:text-cyan-400 transition-all group-hover:scale-110">
             <Icon size={22} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 group-hover:text-white transition-colors">{label}</span>
       </div>
       <ChevronRightIcon size={16} className="text-gray-700 group-hover:text-cyan-400 transition-all transform group-hover:translate-x-1 relative z-10" />
       <div className="absolute bottom-0 right-0 w-20 h-20 bg-cyan-500/5 blur-[30px] rounded-full -mr-10 -mb-10 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function ActionHubButton({ icon: Icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-5 min-w-[90px] hover:bg-white/[0.05] rounded-[2rem] transition-all duration-500 group relative"
    >
       <div className="w-14 h-14 rounded-[1.5rem] bg-white/[0.03] flex items-center justify-center text-gray-500 group-hover:text-cyan-400 group-hover:scale-110 transition-all border border-white/5 group-hover:border-cyan-400/30 shadow-xl">
          <Icon size={24} />
       </div>
       <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-500 group-hover:text-cyan-400 transition-colors">{label}</span>
       <div className="absolute bottom-2 w-1 h-1 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}





function AdminSelectionCertificates({ students, setStatus }: { students: any[], setStatus: any }) {
   const [category, setCategory] = useState('Excellence in Quantization Mastery');
   const [loading, setLoading] = useState(false);

   const handleIssue = async () => {
      setLoading(true);
      try {
         for (const student of students) {
            await addDoc(collection(db, 'certificates'), {
               userId: student.id,
               userName: student.displayName || student.email,
               topicName: category,
               createdAt: serverTimestamp(),
               verificationCode: Math.random().toString(36).substring(2, 10).toUpperCase()
            });

            // Also send notification
            await addDoc(collection(db, 'notifications'), {
               userId: student.id,
               title: "New Credential Issued",
               body: `You have been awarded: ${category}. Direct to profile to view.`,
               type: 'award',
               status: 'pending',
               createdAt: serverTimestamp()
            });
         }
         setStatus({ type: 'success', message: `${students.length} certificates cryptographically signed and issued.` });
      } catch (e) {
         console.error(e);
         setStatus({ type: 'error', message: "Issuance sequence failed." });
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="p-12 glass-card rounded-[3.5rem] border border-amber-500/20 bg-amber-500/[0.02] shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-10 relative z-10">
               <div>
                  <h4 className="text-xl font-bold tracking-tight text-amber-500 uppercase italic">Credential <span className="font-light not-italic">Issuance</span></h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.4em] mt-1">Authorize digital certificates</p>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Award size={24} />
               </div>
            </div>

            <div className="space-y-10 relative z-10">
               <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500 px-6">Credential Category</label>
                  <select 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[#0A0C16] border border-white/10 p-6 rounded-[1.5rem] text-sm font-bold outline-none focus:border-amber-500/50 transition-all text-white shadow-inner"
                  >
                     <option>Excellence in Quantization Mastery</option>
                     <option>Advanced Logic Protocol Completion</option>
                     <option>System Architecture Certification</option>
                  </select>
               </div>
               <button 
                 onClick={handleIssue}
                 disabled={loading}
                 className="group w-full py-7 bg-amber-500 text-black rounded-[2rem] font-bold uppercase tracking-[0.4em] text-[11px] shadow-[0_20px_50px_rgba(245,158,11,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 border border-white/20 disabled:opacity-50"
               >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} className="group-hover:scale-110 transition-transform" />}
                  {loading ? 'Signing Credentials...' : 'Sign & Distribute Credentials'}
               </button>
            </div>
            
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full" />
         </div>
         <div className="p-8 bg-rose-500/[0.03] rounded-3xl border border-rose-500/10 flex items-start gap-6 relative z-10">
            <AlertTriangle className="text-rose-500 shrink-0 mt-1" size={24} />
            <p className="text-[11px] font-semibold text-gray-500 leading-relaxed uppercase tracking-wider">Operational Constraint: Digital signatures are cryptographically anchored and immutable. Ensure all terminal metrics align with the issuing threshold prior to execution.</p>
         </div>
      </div>
   );
}


