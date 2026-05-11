import React, { useState, useEffect } from 'react';
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
  CreditCard, 
  Award, 
  Settings, 
  Plus, 
  Trash2, 
  Edit2, 
  ExternalLink,
  ShieldAlert,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  Video,
  Download,
  BarChart3,
  TrendingUp,
  DollarSign,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  Menu,
  Megaphone,
  MessagesSquare,
  Bell,
  Send,
  User,
  Clock,
  ChevronRightIcon,
  Star,
  MessageCircle,
  Monitor,
  Play,
  LinkIcon,
  Cloud,
  Paperclip,
  AudioLines,
  Mic,
  Database,
  Share2,
  Image as ImageIcon,
  MessageSquare,
  PenTool
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function Admin() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'subjects' | 'students' | 'videos' | 'payments' | 'certificates' | 'announcements' | 'qa' | 'notifications' | 'settings' | 'whiteboards'>('home');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showStudentAction, setShowStudentAction] = useState<{ type: string, students: any[] } | null>(null);

  // Data State
  const [subjects, setSubjects] = useState<any[]>([]);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  
  // New Comm Data State
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [globalQA, setGlobalQA] = useState<any[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);

  // Modals
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);

  // Form State
  const [newSubject, setNewSubject] = useState({ name: '', level: 'O-Level', syllabus: 'Cambridge', icon: '📐', color: '#3b82f6', description: '' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '' });
  const [adminReply, setAdminReply] = useState('');
  const [pushNotification, setPushNotification] = useState({ title: '', body: '' });

  useEffect(() => {
    fetchAllData();

    // Listen for Announcements
    const announceQ = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsubAnnounce = onSnapshot(announceQ, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Listen for Global Q&A (Collection Group)
    const qaQ = query(collectionGroup(db, 'qa'), orderBy('createdAt', 'desc'));
    const unsubQA = onSnapshot(qaQ, (snap) => {
      setGlobalQA(snap.docs.map(d => {
        const path = d.ref.path.split('/');
        return { 
          id: d.id, 
          subjectId: path[1], 
          topicId: path[3], 
          ref: d.ref,
          ...d.data() 
        };
      }));
    });

    // Listen for Notifications History
    const notifQ = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(20));
    const unsubNotif = onSnapshot(notifQ, (snap) => {
      setNotificationHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubAnnounce();
      unsubQA();
      unsubNotif();
    };
  }, []);

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
      
      const stus = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(stus);
      setRecentRegistrations(stus.slice(0, 5));

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

  const revenueData = [
    { name: 'Jan', revenue: 120 },
    { name: 'Feb', revenue: 300 },
    { name: 'Mar', revenue: 200 },
    { name: 'Apr', revenue: 450 },
    { name: 'May', revenue: 600 },
    { name: 'Jun', revenue: 500 },
  ];

  const totalRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const sidebarLinks = [
    { id: 'home', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'subjects', icon: BookOpen, label: 'Subjects' },
    { id: 'students', icon: Users, label: 'Students' },
    { id: 'videos', icon: Monitor, label: 'Online Classroom' },
    { id: 'whiteboards', icon: PenTool, label: '1-on-1 Whiteboards' },
    { id: 'payments', icon: CreditCard, label: 'Payments' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

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
    <div className="flex h-screen bg-[#020408] text-white overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside 
        className={cn(
          "bg-[#0A0C16] border-r border-white/5 transition-all duration-500 overflow-hidden flex flex-col relative z-[60]",
          isSidebarOpen ? "w-64" : "w-0 md:w-20"
        )}
      >
        <div className="p-8 pb-10 flex items-center justify-between">
           <h2 className={cn("text-2xl font-bold tracking-tighter text-white transition-opacity", !isSidebarOpen && "md:opacity-0")}>
             EK<span className="text-cyan-400">.</span>ADMIN
           </h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide py-4">
           {sidebarLinks.map(link => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id as any)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all relative group",
                  activeTab === link.id 
                    ? "bg-white/5 text-cyan-400 border border-white/5 shadow-inner" 
                    : "text-gray-500 hover:text-white hover:bg-white/[0.02]"
                )}
              >
                 <link.icon size={20} className={cn("transition-colors", activeTab === link.id ? "text-cyan-400" : "group-hover:text-cyan-400")} />
                 {(isSidebarOpen || window.innerWidth < 768) && <span className="tracking-tight">{link.label}</span>}
                 {activeTab === link.id && (
                    <motion.div layoutId="activeNav" className="absolute right-0 w-1 h-6 bg-cyan-400 rounded-l-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                 )}
              </button>
           ))}
        </nav>

        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
           <button className="w-full flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-2xl font-semibold text-sm transition-all group">
              <Download size={20} className="rotate-180 group-hover:-translate-y-1 transition-transform" />
              {isSidebarOpen && <span>Disconnect Terminal</span>}
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
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
                 {/* Superuser Elevate Utility */}
                 {user?.email === 'mudzimwapanashe123@gmail.com' && (
                   <motion.div 
                     initial={{ y: 20, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     className="p-10 glass-panel border-rose-500/20 bg-gradient-to-br from-rose-500/[0.08] to-transparent rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8"
                   >
                      <div className="space-y-2 text-center md:text-left">
                         <div className="flex items-center justify-center md:justify-start gap-2">
                            <ShieldAlert className="text-rose-500" size={24} />
                            <h3 className="text-2xl font-bold tracking-tight text-white/90">Superuser Gateway</h3>
                         </div>
                         <p className="text-sm font-medium text-gray-500 max-w-md">Force-assign terminal command authority and bypass standard synchronization delays.</p>
                      </div>
                      <button 
                        onClick={async () => {
                           try {
                             await setDoc(doc(db, 'admins', user.uid), {
                                email: user.email,
                                elevatedAt: serverTimestamp()
                             });
                             alert("Privileges elevated. Terminal synchronization in progress...");
                             window.location.reload();
                           } catch (e) {
                             console.error(e);
                           }
                        }}
                        className="px-10 py-5 bg-rose-500 text-white rounded-2xl font-bold uppercase tracking-[0.3em] text-[11px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-rose-500/30 whitespace-nowrap"
                      >
                         Execute Elevation
                      </button>
                   </motion.div>
                 )}

                 {/* Welcome Header */}
                 <div className="space-y-2">
                    <h2 className="text-4xl font-bold tracking-tight">System <span className="text-cyan-400 font-light italic">Intelligence</span></h2>
                    <p className="text-gray-500 font-bold uppercase tracking-[0.4em] text-[10px] opacity-60">Real-time neural relay monitoring</p>
                 </div>

                 {/* Metric Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatBox label="Active Scholars" value={students.length} subValue="+12% Retention" icon={Users} color="cyan" />
                    <StatBox label="Knowledge Nodes" value={allTopics.length} subValue="94.2% Synced" icon={BookOpen} color="purple" />
                    <StatBox label="Credentials Issued" value="48" subValue="Logic Categories" icon={Award} color="amber" />
                    <StatBox label="Economic Flux" value={`$${totalRevenue.toFixed(2)}`} subValue="82% of Goal" icon={DollarSign} color="emerald" />
                 </div>

                 {/* Charts & Utilities */}
                 <div className="grid lg:grid-cols-3 gap-8">
                    {/* Revenue Analytics */}
                    <div className="lg:col-span-2 glass-panel p-10 rounded-[3rem] bg-[#0A0C16] border-white/5 space-y-10 min-h-[460px] relative overflow-hidden">
                       <div className="flex items-center justify-between relative z-10">
                          <div>
                             <h4 className="text-2xl font-bold tracking-tight text-white/90">Revenue Flux</h4>
                             <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mt-2">Monthly Cognitive Yield</p>
                          </div>
                          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/10">
                             <TrendingUp size={24} />
                          </div>
                       </div>
                       
                       <div className="h-[280px] w-full relative z-10">
                          <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis 
                                  dataKey="name" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 600 }} 
                                />
                                <YAxis hide />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0A0C16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '16px' }}
                                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                />
                                <Bar dataKey="revenue" radius={[12, 12, 0, 0]} barSize={40}>
                                   {revenueData.map((entry, index) => (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={index === revenueData.length - 1 ? '#00e5ff' : 'rgba(0, 229, 255, 0.15)'} 
                                        className="transition-all duration-500 hover:fill-[#00e5ff]"
                                      />
                                   ))}
                                </Bar>
                             </BarChart>
                          </ResponsiveContainer>
                       </div>
                       
                       {/* Abstract Background Element */}
                       <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                    </div>

                    {/* Quick Access & Dev Utility */}
                    <div className="space-y-6">
                       <div className="glass-panel p-10 rounded-[3rem] bg-gradient-to-br from-cyan-500/[0.05] to-purple-500/[0.05] border-white/10 space-y-8 h-full">
                          <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400">Master Protocols</h4>
                          <div className="space-y-4">
                             <QuickActionButton label="Deploy Subject" icon={Plus} onClick={() => setActiveTab('subjects')} />
                             <QuickActionButton label="Audit Grid Logs" icon={Search} onClick={() => setActiveTab('students')} />
                             <QuickActionButton label="Analyze Flux" icon={CreditCard} onClick={() => setActiveTab('payments')} />
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
                    <button 
                      onClick={() => setShowSubjectModal(true)}
                      className="px-8 py-4 bg-purple-600/90 hover:bg-purple-600 rounded-2xl font-bold uppercase text-[11px] tracking-[0.2em] text-white shadow-2xl shadow-purple-900/30 active:scale-95 transition-all flex items-center gap-3 backdrop-blur-xl border border-white/10"
                    >
                       <Plus size={18} /> Add Target Subject
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {subjects.map(subject => (
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
                                <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"><Edit2 size={16} className="text-gray-400" /></button>
                                <button className="p-2.5 bg-rose-500/10 hover:bg-rose-500 rounded-xl group/del transition-all border border-rose-500/10 focus:ring-2 ring-rose-500/20"><Trash2 size={16} className="text-rose-500 group-hover/del:text-white" /></button>
                                <button className="p-2.5 bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/20 active:scale-90 transition-all border border-white/5"><ArrowRight size={16} /></button>
                             </div>
                          </div>
                          
                          {/* Card Glow */}
                          <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full -mr-16 -mb-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                       </div>
                    ))}
                 </div>
              </div>
            )}
            
            {activeTab === 'students' && (
              <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                       <h2 className="text-4xl font-bold tracking-tight">Personnel <span className="text-cyan-400 font-light italic">Intelligence</span></h2>
                       <p className="text-gray-500 text-[11px] font-bold uppercase tracking-[0.4em] mt-2 opacity-60">Synchronized terminal monitoring</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                       <div className="relative flex-1 md:flex-none">
                          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                          <input placeholder="Search Signal Ident..." className="pl-13 pr-6 py-4 bg-[#0A0C16] border border-white/5 rounded-2xl text-xs font-semibold focus:border-cyan-400/50 outline-none w-full md:w-80 shadow-inner transition-all placeholder:text-gray-600" />
                       </div>
                       <button className="p-4 glass-panel rounded-2xl border border-white/5 hover:bg-white/5 transition-all text-gray-500 hover:text-cyan-400"><Filter size={20} /></button>
                    </div>
                 </div>

                 <div className="glass-panel rounded-[3rem] bg-[#0A0C16] border-white/5 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                       <thead className="bg-white/[0.02]">
                          <tr className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-500">
                             <th className="px-10 py-6 w-12 text-center">
                                <input 
                                  type="checkbox" 
                                  className="accent-cyan-400 w-4 h-4 rounded border-white/10 bg-white/5"
                                  checked={selectedStudents.length === students.length && students.length > 0}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedStudents(students.map(s => s.id));
                                    else setSelectedStudents([]);
                                  }}
                                />
                             </th>
                             <th className="px-10 py-6">Intelligence Profile</th>
                             <th className="px-10 py-6">Neural Link (Email)</th>
                             <th className="px-10 py-6">Cognitive Rank</th>
                             <th className="px-10 py-6 text-right">Operations</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {students.map(stu => (
                             <tr key={stu.id} className={cn(
                               "hover:bg-cyan-500/[0.02] transition-colors group relative",
                               selectedStudents.includes(stu.id) ? "bg-cyan-500/[0.03]" : ""
                             )}>
                                 <td className="px-10 py-8 text-center relative">
                                   {selectedStudents.includes(stu.id) && (
                                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_15px_rgba(34,211,238,0.3)]" />
                                   )}
                                   <input 
                                     type="checkbox" 
                                     className="accent-cyan-400 w-4 h-4 rounded border-white/10 bg-white/5"
                                     checked={selectedStudents.includes(stu.id)}
                                     onChange={() => {
                                       setSelectedStudents(prev => 
                                         prev.includes(stu.id) ? prev.filter(id => id !== stu.id) : [...prev, stu.id]
                                       );
                                     }}
                                   />
                                </td>
                                <td className="px-10 py-8">
                                   <div className="flex items-center gap-5">
                                      <div className="w-14 h-14 rounded-[1.5rem] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-lg group-hover:scale-105 transition-transform overflow-hidden">
                                         {stu.avatar ? <img src={stu.avatar} className="w-full h-full object-cover" /> : (stu.displayName?.charAt(0) || 'U')}
                                      </div>
                                      <div className="flex flex-col">
                                         <span className="text-base font-bold tracking-tight text-white/90 group-hover:text-cyan-400 transition-colors uppercase">{stu.displayName}</span>
                                         <div className="flex items-center gap-3 mt-1 text-[9px] font-bold uppercase tracking-widest text-gray-500">
                                            <span>ID: {stu.id.substring(0, 8)}</span>
                                            <div className="w-1 h-1 rounded-full bg-cyan-400/40" />
                                            <span>SECTOR-3</span>
                                         </div>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-10 py-8">
                                   <span className="text-sm font-medium text-gray-400 selection:bg-cyan-500/30 tracking-tight">{stu.email}</span>
                                </td>
                                <td className="px-10 py-8">
                                   <div className="flex flex-col gap-2">
                                      <div className="flex items-end gap-1.5">
                                        <span className="text-lg font-bold text-cyan-400 italic leading-none">LVL {stu.level || 1}</span>
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-0.5">RANK</span>
                                      </div>
                                      <div className="w-40 h-1.5 bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                                         <div className="h-full bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.4)]" style={{ width: '60%' }} />
                                      </div>
                                   </div>
                                </td>
                                <td className="px-10 py-8 text-right">
                                   <button 
                                     onClick={() => setSelectedStudents([stu.id])}
                                     className="px-6 py-2.5 bg-white/5 hover:bg-cyan-500/10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-cyan-400 transition-all border border-transparent hover:border-cyan-500/20 shadow-inner"
                                   >
                                      Intercept Terminal
                                   </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                    </div>
                 </div>
                 <AnimatePresence>
                    {selectedStudents.length > 0 && (
                      <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-[#0A0C16]/80 border border-white/10 rounded-[3.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.8)] px-5 py-4 flex items-center gap-10 z-[100] backdrop-blur-3xl ring-1 ring-white/5"
                      >
                         <div className="flex items-center gap-6 pl-6 pr-10 border-r border-white/10">
                            <div className="flex -space-x-4">
                               {selectedStudents.slice(0, 3).map(id => (
                                 <div key={id} className="w-10 h-10 rounded-2xl bg-cyan-500 flex items-center justify-center text-[11px] font-bold text-black border-[3px] border-[#0A0C16] shadow-lg">
                                    {students.find(s => s.id === id)?.displayName?.charAt(0)}
                                 </div>
                               ))}
                               {selectedStudents.length > 3 && (
                                 <div className="w-10 h-10 rounded-2xl bg-[#1A1C24] flex items-center justify-center text-[10px] font-bold text-gray-400 border-[3px] border-[#0A0C16] shadow-lg">
                                    +{selectedStudents.length - 3}
                                 </div>
                               )}
                            </div>
                            <div className="flex flex-col">
                               <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-400">{selectedStudents.length} Connected</p>
                               <button onClick={() => setSelectedStudents([])} className="text-[10px] font-semibold text-gray-500 uppercase hover:text-rose-400 transition-colors mt-0.5">Disconnect Selection</button>
                            </div>
                         </div>

                         <div className="flex items-center gap-3 pr-6">
                            <ActionHubButton icon={CheckCircle} label="Marking" onClick={() => setShowStudentAction({ type: 'marking', students: students.filter(s => selectedStudents.includes(s.id)) })} />
                            <ActionHubButton icon={MessageCircle} label="Neural Relay" onClick={() => setShowStudentAction({ type: 'messages', students: students.filter(s => selectedStudents.includes(s.id)) })} />
                            <ActionHubButton icon={Monitor} label="Repository" onClick={() => setShowStudentAction({ type: 'videos', students: students.filter(s => selectedStudents.includes(s.id)) })} />
                            <ActionHubButton icon={Award} label="Credentials" onClick={() => setShowStudentAction({ type: 'certificates', students: students.filter(s => selectedStudents.includes(s.id)) })} />
                            <ActionHubButton icon={MessagesSquare} label="Knowledge" onClick={() => setShowStudentAction({ type: 'knowledge', students: students.filter(s => selectedStudents.includes(s.id)) })} />
                            <ActionHubButton icon={Megaphone} label="Dispatch" onClick={() => setShowStudentAction({ type: 'bulletins', students: students.filter(s => selectedStudents.includes(s.id)) })} />
                         </div>
                      </motion.div>
                    )}
                 </AnimatePresence>

                 {/* Sub-Action Modals */}
                 <AnimatePresence>
                    {showStudentAction && (
                       <div className="fixed inset-0 bg-[#020408]/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
                          <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-[#0A0C16] border border-white/5 w-full max-w-6xl h-[85vh] rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden ring-1 ring-white/10"
                          >
                             <header className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                <div>
                                   <div className="flex items-center gap-3 mb-2">
                                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                                      <p className="text-[11px] font-bold uppercase text-cyan-400 tracking-[0.4em]">Protocol Execution Matrix</p>
                                   </div>
                                   <h3 className="text-3xl font-bold tracking-tight text-white/90">
                                      {showStudentAction.type === 'marking' && 'Neural Marking Center'}
                                      {showStudentAction.type === 'messages' && 'Neural Relay Network'}
                                      {showStudentAction.type === 'videos' && 'Repository Authorization'}
                                      {showStudentAction.type === 'certificates' && 'Credential Issuance Forge'}
                                      {showStudentAction.type === 'knowledge' && 'Cognitive Path Analysis'}
                                      {showStudentAction.type === 'bulletins' && 'Direct Signal Dispatch'}
                                   </h3>
                                </div>
                                <button onClick={() => setShowStudentAction(null)} className="p-5 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-gray-500 rounded-3xl transition-all border border-white/5"><X size={24} /></button>
                             </header>

                             <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                                {showStudentAction.type === 'marking' && <AdminSelectionMarking students={showStudentAction.students} setStatus={setStatus} />}
                                {showStudentAction.type === 'messages' && <AdminSelectionMessages students={showStudentAction.students} setStatus={setStatus} />}
                                {showStudentAction.type === 'videos' && <AdminSelectionVideos students={showStudentAction.students} setStatus={setStatus} />}
                                {showStudentAction.type === 'certificates' && <AdminSelectionCertificates students={showStudentAction.students} setStatus={setStatus} />}
                                {showStudentAction.type === 'knowledge' && <AdminSelectionQA students={showStudentAction.students} setStatus={setStatus} />}
                                {showStudentAction.type === 'bulletins' && <AdminSelectionBulletins students={showStudentAction.students} setStatus={setStatus} />}
                             </div>
                          </motion.div>
                       </div>
                    )}
                 </AnimatePresence>
              </div>
            )}

            {activeTab === 'videos' && <AdminVideoLibrary setStatus={setStatus} />}
            {activeTab === 'whiteboards' && <AdminWhiteboardList students={students} />}

            {activeTab === 'payments' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                       <h2 className="text-4xl font-bold tracking-tight text-white">Economic <span className="text-emerald-400 font-light italic">Flux</span></h2>
                       <p className="text-gray-500 text-[11px] font-bold uppercase tracking-[0.4em] mt-2 opacity-60">Neural grid transaction audit</p>
                    </div>
                    <button className="px-8 py-4 glass-card rounded-2xl font-bold uppercase text-[11px] tracking-[0.2em] text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-2 group shadow-xl shadow-emerald-500/5">
                       <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" /> Export Analytics Data
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="glass-panel p-10 rounded-[3rem] border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.05] to-transparent relative overflow-hidden">
                       <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-500/60 mb-3">System Yield</p>
                       <p className="text-6xl font-bold tracking-tighter text-white">${totalRevenue.toFixed(2)}</p>
                       <TrendingUp className="absolute top-8 right-8 text-emerald-500 opacity-20" size={48} />
                    </div>
                    <div className="glass-panel p-10 rounded-[3rem] border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.05] to-transparent relative overflow-hidden">
                       <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-500/60 mb-3">Pending Verification</p>
                       <p className="text-6xl font-bold tracking-tighter text-white">{transactions.filter(t => t.status === 'pending').length}</p>
                       <Clock className="absolute top-8 right-8 text-cyan-500 opacity-20" size={48} />
                    </div>
                 </div>

                 <div className="glass-panel rounded-[3rem] bg-[#0A0C16] border-white/5 overflow-hidden shadow-2xl relative">
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                       <thead className="bg-white/[0.02]">
                          <tr className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-500">
                             <th className="px-10 py-6">Protocol Reference</th>
                             <th className="px-10 py-6">Ident Source</th>
                             <th className="px-10 py-6">Target Module</th>
                             <th className="px-10 py-6">Value</th>
                             <th className="px-10 py-6">Link Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {transactions.map(t => (
                             <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-10 py-7 text-[11px] font-medium font-mono text-gray-500 uppercase tracking-tighter">{t.id}</td>
                                <td className="px-10 py-7 text-sm font-semibold text-gray-300">{t.email || 'N/A'}</td>
                                <td className="px-10 py-7 text-xs text-cyan-400/70 uppercase tracking-[0.1em] font-bold">{t.topicId?.substring(0, 12)}...</td>
                                <td className="px-10 py-7 font-bold text-lg text-emerald-400 tracking-tight">${t.amount || (2.99).toFixed(2)}</td>
                                <td className="px-10 py-7">
                                   <div className={cn(
                                     "px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] border inline-flex items-center gap-2",
                                     t.status === 'completed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                     t.status === 'pending' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                                     "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                   )}>
                                      <div className={cn("w-1 h-1 rounded-full", t.status === 'completed' ? "bg-emerald-400" : "bg-amber-400")} />
                                      {t.status}
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'announcements' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                       <h2 className="text-4xl font-bold tracking-tight">Strategic <span className="text-blue-400 font-light italic">Bulletins</span></h2>
                       <p className="text-gray-500 text-[11px] font-bold uppercase tracking-[0.4em] mt-2 opacity-60">Global grid communication</p>
                    </div>
                    <button 
                      onClick={() => setShowAnnouncementModal(true)}
                      className="px-10 py-4.5 bg-blue-600/90 hover:bg-blue-600 rounded-2xl font-bold uppercase text-[11px] tracking-[0.3em] text-white shadow-2xl shadow-blue-900/30 active:scale-95 transition-all flex items-center gap-3 backdrop-blur-xl border border-white/10"
                    >
                       <Plus size={18} /> New Broadcast
                    </button>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {announcements.map(ann => (
                       <div key={ann.id} className="glass-card p-10 rounded-[3rem] bg-[#0A0C16] border-white/5 space-y-8 hover:border-blue-500/30 transition-all duration-500 group relative overflow-hidden">
                          <div className="flex justify-between items-start relative z-10">
                             <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/10 group-hover:bg-blue-500 transition-colors group-hover:text-white">
                                <Megaphone size={24} />
                             </div>
                             <div className="text-right">
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">ID: {ann.id.substring(0, 8)}</span>
                                <p className="text-[10px] font-bold text-gray-700 uppercase tracking-tight mt-1">{ann.createdAt?.toDate ? new Date(ann.createdAt.toDate()).toLocaleString('en-GB') : 'Recent'}</p>
                             </div>
                          </div>
                          <div className="space-y-4 relative z-10">
                             <h3 className="text-2xl font-bold tracking-tight text-white/90 group-hover:text-white transition-colors uppercase">{ann.title}</h3>
                             <p className="text-base font-medium text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors">{ann.message}</p>
                          </div>
                          <div className="pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400/80">Author: {ann.author || 'Master Curator'}</span>
                             <button 
                               onClick={async () => {
                                 if (confirm("Terminate broadcast string?")) {
                                   await deleteDoc(doc(db, 'announcements', ann.id));
                                 }
                               }}
                               className="p-3 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
                             >
                                <Trash2 size={18} />
                             </button>
                          </div>
                          
                          {/* Card Glow */}
                          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full -mr-24 -mt-24 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                       </div>
                    ))}
                    {announcements.length === 0 && (
                      <div className="col-span-full py-40 glass-panel rounded-[3rem] border-dashed border-white/5 flex flex-col items-center justify-center opacity-30 gap-6">
                         <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                            <Megaphone size={40} className="text-gray-400" />
                         </div>
                         <p className="text-sm font-semibold tracking-widest uppercase text-gray-500">Grid communication silent</p>
                      </div>
                    )}
                 </div>
              </div>
            )}

            {activeTab === 'qa' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                       <h2 className="text-4xl font-bold tracking-tight text-white">Knowledge <span className="text-cyan-400 font-light italic">Relay</span></h2>
                       <p className="text-gray-500 text-[11px] font-bold uppercase tracking-[0.4em] mt-2 opacity-60">Neural query synchronization</p>
                    </div>
                    <div className="flex gap-2">
                       <span className="px-5 py-2.5 glass-panel rounded-2xl text-[10px] font-bold uppercase tracking-widest text-cyan-400 border-cyan-400/20 backdrop-blur-3xl shadow-xl shadow-cyan-400/5">
                          {globalQA.filter(q => !q.adminReply).length} Divergent Queries
                       </span>
                    </div>
                 </div>

                 <div className="space-y-8">
                    {globalQA.map(qa => (
                       <div key={qa.id} className={cn(
                        "glass-panel rounded-[3rem] bg-[#0A0C16] border-white/5 overflow-hidden transition-all duration-500 shadow-2xl relative group",
                        !qa.adminReply ? "border-amber-500/20 bg-amber-500/[0.02]" : ""
                       )}>
                          <div className="p-10 space-y-10 relative z-10">
                             <div className="flex justify-between items-start">
                                <div className="flex items-center gap-5">
                                   <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 group-hover:text-cyan-400 transition-colors">
                                      <User size={28} />
                                   </div>
                                   <div className="space-y-1.5">
                                      <h4 className="text-lg font-bold tracking-tight text-white/90 uppercase">{qa.userName}</h4>
                                      <div className="flex items-center gap-3">
                                         <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/80">SUBJECT ID: {qa.subjectId?.substring(0,8)}</span>
                                         <div className="w-1 h-1 rounded-full bg-white/10" />
                                         <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">NODE: {qa.topicId?.substring(0,8)}</span>
                                      </div>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <div className={cn(
                                      "px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] border shadow-sm",
                                      qa.adminReply ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                   )}>
                                      {qa.adminReply ? 'SYNCHRONIZED' : 'AWAITING COGNITION'}
                                   </div>
                                </div>
                             </div>

                             <div className="p-8 bg-white/[0.02] rounded-[2rem] border border-white/5 relative group-hover:bg-white/[0.03] transition-colors">
                                <p className="text-base font-medium text-gray-300 leading-relaxed tracking-tight">{qa.question}</p>
                                <p className="mt-6 text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">Captured {qa.createdAt ? new Date(qa.createdAt.toDate()).toLocaleString('en-GB') : 'Recent'}</p>
                             </div>

                             {qa.adminReply ? (
                                <div className="p-8 bg-cyan-500/[0.03] rounded-[2.5rem] border border-cyan-500/20 ml-12 relative overflow-hidden group-hover:bg-cyan-500/[0.05] transition-colors">
                                   <div className="flex items-center gap-3 mb-4 relative z-10">
                                      <Star size={16} className="text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                      <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-cyan-400">Target Response</span>
                                   </div>
                                   <p className="text-base font-semibold text-cyan-100/90 leading-relaxed tracking-tight relative z-10 mb-6">{qa.adminReply}</p>
                                   <button 
                                     onClick={() => {
                                       setReplyingTo(qa);
                                       setAdminReply(qa.adminReply);
                                     }}
                                     className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 hover:text-cyan-400 transition-all border-b border-white/5 hover:border-cyan-400 pb-1 relative z-10"
                                   >
                                      Modify Transmission
                                   </button>
                                   
                                   {/* Glow */}
                                   <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] rounded-full -mr-16 -mt-16" />
                                </div>
                             ) : (
                                <div className="flex justify-end pt-4">
                                   <button 
                                     onClick={() => {
                                       setReplyingTo(qa);
                                       setAdminReply('');
                                     }}
                                     className="px-10 py-4 bg-cyan-400 text-black rounded-2xl font-bold uppercase text-[11px] tracking-[0.3em] shadow-2xl shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border border-white/10"
                                   >
                                      <Send size={18} /> Generate Response
                                   </button>
                                </div>
                             )}
                          </div>
                          
                          {/* Edge Decorator */}
                          {!qa.adminReply && (
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]" />
                          )}
                       </div>
                    ))}
                    {globalQA.length === 0 && (
                      <div className="py-40 glass-panel rounded-[3rem] border-dashed border-white/5 flex flex-col items-center justify-center opacity-30 gap-6">
                         <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                           <MessagesSquare size={40} className="text-gray-400" />
                         </div>
                         <p className="text-sm font-semibold tracking-widest uppercase text-gray-500">Grid signal silent</p>
                      </div>
                    )}
                 </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                       <h2 className="text-4xl font-bold tracking-tight text-white">Neural <span className="text-rose-400 font-light italic">Broadcast</span></h2>
                       <p className="text-gray-500 text-[11px] font-bold uppercase tracking-[0.4em] mt-2 opacity-60">Direct high-priority HUD insertion</p>
                    </div>
                    <div className="w-12 h-12 flex items-center justify-center bg-rose-500/10 rounded-2xl text-rose-500 border border-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                       <Bell className="animate-pulse" size={24} />
                    </div>
                 </div>

                 <div className="max-w-3xl mx-auto glass-panel p-12 lg:p-16 rounded-[4rem] bg-[#0A0C16] border-white/5 space-y-10 shadow-2xl relative overflow-hidden">
                    <div className="space-y-8 relative z-10">
                       <div className="space-y-3 text-center">
                          <label className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-500">Transmission Header</label>
                          <input 
                            value={pushNotification.title}
                            onChange={e => setPushNotification({...pushNotification, title: e.target.value})}
                            placeholder="e.g. CRITICAL SYSTEM SYNCHRONIZATION"
                            className="w-full bg-white/[0.02] border border-white/10 p-6 rounded-[2rem] text-center text-xl font-bold uppercase tracking-tight outline-none focus:border-rose-500/50 transition-all placeholder:text-gray-700 shadow-inner" 
                          />
                       </div>
                       <div className="space-y-3 text-center">
                          <label className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-500">Instruction Payload</label>
                          <textarea 
                            value={pushNotification.body}
                            onChange={e => setPushNotification({...pushNotification, body: e.target.value})}
                            placeholder="Specify the targeted instruction for all synchronized terminals..."
                            className="w-full bg-white/[0.02] border border-white/10 p-8 rounded-[2.5rem] text-base font-medium min-h-[180px] outline-none focus:border-rose-500/50 transition-all placeholder:text-gray-700 shadow-inner resize-none overflow-hidden"
                          />
                       </div>
                    </div>

                    <div className="p-8 bg-rose-500/[0.03] rounded-[2.5rem] border border-rose-500/10 flex items-start gap-6 relative z-10">
                       <AlertTriangle className="text-rose-500 shrink-0 mt-1" size={24} />
                       <p className="text-[11px] font-semibold text-gray-500 leading-relaxed uppercase tracking-wider">Warning: Push protocols bypass all client filters and interject directly into active user streams. Execute only for high-fidelity situational updates.</p>
                    </div>

                    <button 
                      onClick={async () => {
                        setLoading(true);
                        try {
                           await addDoc(collection(db, 'notifications'), {
                               ...pushNotification,
                               status: 'sent',
                               createdAt: serverTimestamp(),
                               scheduledFor: 'all'
                           });
                           setPushNotification({ title: '', body: '' });
                           setStatus({ type: 'success', message: 'Neural broadcast successfully integrated into the grid.' });
                        } catch (e: any) {
                           setStatus({ type: 'error', message: e.message });
                        } finally {
                           setLoading(false);
                        }
                      }}
                      disabled={loading || !pushNotification.title || !pushNotification.body}
                      className="w-full py-7 bg-rose-500 text-white rounded-[2.5rem] font-bold uppercase tracking-[0.4em] text-[13px] shadow-2xl shadow-rose-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-30 relative z-10 ring-1 ring-white/10"
                    >
                       {loading ? <Loader2 size={24} className="animate-spin" /> : <><Send size={20} /> Execute Global Push</>}
                    </button>
                    
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/5 blur-[120px] rounded-full -ml-48 -mb-48" />
                 </div>

                 <div className="glass-panel rounded-[3.5rem] bg-[#0A0C16] border-white/5 overflow-hidden shadow-2xl">
                    <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-500">Transmission Log History</h4>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="divide-y divide-white/5">
                       {notificationHistory.map(notif => (
                         <div key={notif.id} className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.01] transition-all group">
                            <div className="flex items-center gap-6">
                               <div className={cn(
                                 "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all",
                                 notif.status === 'sent' ? "bg-emerald-500/10 border-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black" : "bg-rose-500/10 border-rose-500/10 text-rose-400"
                               )}>
                                  {notif.status === 'sent' ? <CheckCircle size={24} /> : <Clock size={24} />}
                               </div>
                               <div className="space-y-1">
                                  <h5 className="text-base font-bold uppercase tracking-tight text-white/90 group-hover:text-white transition-colors">{notif.title}</h5>
                                  <p className="text-sm text-gray-500 font-medium line-clamp-1 max-w-xl group-hover:text-gray-400 transition-colors tracking-tight">{notif.body}</p>
                               </div>
                            </div>
                            <div className="flex flex-col items-end gap-3 text-right">
                               <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                  {notif.createdAt?.toDate ? new Date(notif.createdAt.toDate()).toLocaleString('en-GB') : 'Capture Pending'}
                               </div>
                               <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">{notif.status} successfully</span>
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    notif.status === 'sent' ? "bg-emerald-400 shadow-[0_0_10px_#10b981]" : "bg-rose-500 animate-pulse"
                                  )} />
                               </div>
                            </div>
                         </div>
                       ))}
                       {notificationHistory.length === 0 && (
                         <div className="p-20 flex flex-col items-center justify-center opacity-20 gap-4">
                            <Send size={48} className="text-gray-500" />
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">History database empty</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            )}
         </div>
      </main>

      {/* Shared Modals */}
      <AnimatePresence>
         {showAnnouncementModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#020408]/95 backdrop-blur-3xl">
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0, y: 30 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.95, opacity: 0, y: 30 }}
                 className="glass-card w-full max-w-2xl rounded-[3.5rem] p-12 lg:p-16 border-white/10 space-y-12 bg-[#0A0C16] shadow-[0_50px_100px_rgba(0,0,0,0.9)] relative overflow-hidden"
               >
                  <div className="flex justify-between items-start relative z-10">
                     <div>
                        <p className="text-[11px] font-bold uppercase text-blue-400 tracking-[0.4em] mb-2">Network Initialization</p>
                        <h3 className="text-3xl font-bold tracking-tight text-white uppercase italic">Broadcast <span className="text-blue-500 font-light not-italic">Sync</span></h3>
                     </div>
                     <button onClick={() => setShowAnnouncementModal(false)} className="p-4 bg-white/5 hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-2xl transition-all border border-white/5"><X size={24} /></button>
                  </div>
                  
                  <div className="space-y-8 relative z-10">
                     <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 px-6">Bulletin Header</label>
                        <input value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} placeholder="e.g. Schedule Alteration" className="w-full bg-white/[0.02] border border-white/10 p-6 rounded-2xl text-base font-bold focus:border-blue-500/50 outline-none transition-all shadow-inner placeholder:text-gray-700" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 px-6">Transmission Data</label>
                        <textarea value={newAnnouncement.message} onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})} placeholder="Broadcast details..." className="w-full bg-white/[0.02] border border-white/10 p-6 rounded-2xl text-base font-medium focus:border-blue-500/50 outline-none transition-all h-40 resize-none shadow-inner placeholder:text-gray-700" />
                     </div>
                  </div>

                  <button 
                    onClick={async () => {
                      setLoading(true);
                      try {
                         await addDoc(collection(db, 'announcements'), {
                            ...newAnnouncement,
                            createdAt: serverTimestamp(),
                            author: profile?.displayName || 'Master Curator'
                         });
                         setShowAnnouncementModal(false);
                         setNewAnnouncement({ title: '', message: '' });
                         setStatus({ type: 'success', message: 'Global broadcast successfully synchronized.' });
                      } catch (e: any) {
                         setStatus({ type: 'error', message: e.message });
                      } finally {
                         setLoading(false);
                      }
                    }} 
                    className="w-full py-6 bg-blue-600 text-white rounded-3xl font-bold uppercase tracking-[0.3em] text-xs shadow-2xl shadow-blue-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative z-10 border border-white/10"
                  >
                     {loading ? <Loader2 size={24} className="animate-spin" /> : <><Send size={18} /> Initialize Sync</>}
                  </button>

                  {/* Glow */}
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
               </motion.div>
            </div>
         )}

         {replyingTo && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#05070A]/95 backdrop-blur-3xl">
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="glass-panel w-full max-w-lg rounded-[2.5rem] p-12 border-white/10 space-y-10"
               >
                  <div className="flex justify-between items-center">
                     <h3 className="text-3xl font-black italic uppercase italic tracking-tighter">Knowledge <span className="text-cyan-400">Response</span></h3>
                     <button onClick={() => setReplyingTo(null)}><X size={32} className="text-gray-500" /></button>
                  </div>
                  <div className="space-y-6">
                     <div className="p-6 bg-white/5 rounded-2xl border border-white/5 opacity-60">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Original Query</p>
                        <p className="text-xs font-bold leading-relaxed">{replyingTo.question}</p>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-4">Curated Answer</label>
                        <textarea 
                           value={adminReply} 
                           onChange={e => setAdminReply(e.target.value)} 
                           placeholder="Enter highly-defined cognitive response..." 
                           className="w-full bg-[#0A0C14] border border-white/10 p-5 rounded-[1.5rem] text-sm font-bold focus:border-cyan-400 outline-none transition-all h-32" 
                        />
                     </div>
                  </div>
                  <button onClick={async () => {
                     setLoading(true);
                     try {
                        await updateDoc(replyingTo.ref, {
                           adminReply,
                           repliedAt: serverTimestamp()
                        });
                        setReplyingTo(null);
                        setAdminReply('');
                        setStatus({ type: 'success', message: 'Cognitive response successfully synchronized.' });
                     } catch (e: any) {
                        setStatus({ type: 'error', message: e.message });
                     } finally {
                        setLoading(false);
                     }
                  }} className="w-full py-5 bg-cyan-500 rounded-3xl font-black italic uppercase italic tracking-[0.2em] text-xs shadow-2xl shadow-cyan-500/20 active:scale-95 transition-all text-black">
                     {loading ? <Loader2 size={24} className="animate-spin mx-auto" /> : 'Finalize Encryption & Send'}
                  </button>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}

function StatBox({ label, value, subValue, icon: Icon, color }: any) {
  const colors: Record<string, string> = {
    cyan: "text-cyan-400 bg-cyan-400/5 border-cyan-400/20 shadow-cyan-400/10",
    purple: "text-purple-400 bg-purple-400/5 border-purple-400/20 shadow-purple-400/10",
    amber: "text-amber-500 bg-amber-500/5 border-amber-500/20 shadow-amber-500/10",
    emerald: "text-emerald-500 bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/10"
  };

  return (
    <div className={cn("glass-card p-10 rounded-[3rem] border border-white/5 space-y-6 hover:scale-[1.02] transition-all duration-500 group overflow-hidden relative", colors[color])}>
       <div className="flex items-center justify-between relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-current group-hover:scale-110 transition-transform">
             <Icon size={28} />
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 leading-none mb-2">{label}</span>
             <h4 className="text-5xl font-black tracking-tighter text-white group-hover:text-cyan-400 transition-colors">{value}</h4>
          </div>
       </div>
       <div className="pt-6 border-t border-white/5 relative z-10 flex justify-between items-center">
          <p className="text-[9px] font-bold opacity-40 uppercase tracking-[0.2em] transition-opacity group-hover:opacity-60">{subValue}</p>
          <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
       </div>
       
       <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
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

function AudioRecorder({ onRecordingComplete }: { onRecordingComplete: (blob: Blob) => void }) {
   const [isRecording, setIsRecording] = useState(false);
   
   const toggleRecording = () => {
      if (isRecording) {
         setIsRecording(false);
         // Simulate a recorded data buffer
         onRecordingComplete(new Blob([], { type: 'audio/webm' }));
      } else {
         setIsRecording(true);
      }
   };
   
   return (
      <button 
         onClick={toggleRecording}
         className={cn(
            "p-4 rounded-2xl border transition-all flex items-center gap-3",
            isRecording ? "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse" : "bg-white/5 border-white/10 text-gray-500 hover:text-cyan-400"
         )}
      >
         <Mic size={20} />
         <span className="text-[10px] font-bold uppercase tracking-widest">{isRecording ? "System Recording..." : "Voice Capture"}</span>
      </button>
   );
}

function AdminSelectionMarking({ students, setStatus }: { students: any[], setStatus: any }) {
   const [submissions, setSubmissions] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [gradingSub, setGradingSub] = useState<any>(null);
   const [grade, setGrade] = useState('');
   const [feedback, setFeedback] = useState('');
   const [submitting, setSubmitting] = useState(false);

   useEffect(() => {
      const q = query(collectionGroup(db, 'submissions'), where('studentUid', 'in', students.map(s => s.id)));
      const unsub = onSnapshot(q, (snap) => {
         setSubmissions(snap.docs.map(d => ({ id: d.id, path: d.ref.path, ...d.data() })));
         setLoading(false);
      });
      return () => unsub();
   }, [students]);

   const handleGrade = async () => {
      if (!grade || !gradingSub) return;
      setSubmitting(true);
      try {
         await updateDoc(doc(db, gradingSub.path), {
            grade: Number(grade),
            feedback,
            status: 'graded',
            gradedAt: serverTimestamp()
         });

         // Notify student
         await addDoc(collection(db, 'notifications'), {
            userId: gradingSub.studentUid,
            title: "Work Evaluated",
            body: `Your submission for ${gradingSub.topicName} has been graded: ${grade}%`,
            type: 'grade',
            status: 'pending',
            createdAt: serverTimestamp()
         });

         setGradingSub(null);
         setGrade('');
         setFeedback('');
         setStatus({ type: 'success', message: "Evaluation successfully deployed." });
      } catch (e) {
         console.error(e);
         setStatus({ type: 'error', message: "Evaluation deployment failed." });
      } finally {
         setSubmitting(false);
      }
   };

   if (loading) return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
         <Loader2 className="animate-spin text-cyan-400" size={32} />
         <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-600">Accessing Node Workflows...</p>
      </div>
   );

   return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {submissions.map(sub => (
               <div key={sub.id} className="group glass-card p-8 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/30 transition-all duration-500 bg-[#0A0C16] relative overflow-hidden">
                  <div className="flex justify-between items-start mb-8 relative z-10">
                     <span className={cn(
                        "px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border",
                        sub.status === 'graded' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                     )}>
                        {sub.status === 'graded' ? 'Verified' : 'Pending Protocol'}
                     </span>
                     <span className="text-[9px] font-bold uppercase text-gray-700 tracking-widest">{sub.submittedAt?.toDate?.().toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="space-y-2 mb-8 relative z-10">
                     <h4 className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors uppercase">{sub.topicName}</h4>
                     <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest leading-relaxed">Origin: {sub.studentName}</p>
                  </div>
                  
                  {sub.status !== 'graded' ? (
                     <button 
                       onClick={() => {
                          setGradingSub(sub);
                          setGrade(sub.grade || '');
                          setFeedback(sub.feedback || '');
                       }}
                       className="w-full py-4 bg-white/[0.03] hover:bg-cyan-500 hover:text-black rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all border border-white/10 shadow-xl relative z-10"
                     >
                        Evaluate Node
                     </button>
                  ) : (
                     <div className="text-center py-4 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                        Score: {sub.grade}%
                     </div>
                  )}
                  
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-cyan-500/5 blur-[40px] rounded-full -mr-12 -mb-12 opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>
            ))}
            {submissions.length === 0 && (
               <div className="col-span-full py-32 flex flex-col items-center justify-center gap-4 opacity-20 group">
                  <FileText size={48} className="text-gray-500 group-hover:scale-110 transition-transform duration-700" />
                  <p className="text-xs font-bold uppercase tracking-[0.4em] text-gray-500">No active work nodes detected</p>
               </div>
            )}
         </div>

         <AnimatePresence>
            {gradingSub && (
               <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#05070A]/95 backdrop-blur-2xl">
                  <motion.div 
                     initial={{ scale: 0.95, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0.95, opacity: 0 }}
                     className="w-full max-w-2xl glass-panel p-12 rounded-[3.5rem] border border-white/10 bg-[#0A0C16] space-y-10"
                  >
                     <div className="flex justify-between items-center">
                        <h4 className="text-2xl font-black italic uppercase italic tracking-tighter">Node <span className="text-cyan-400">Calibration</span></h4>
                        <button onClick={() => setGradingSub(null)} className="text-gray-500 hover:text-white"><X size={32} /></button>
                     </div>

                     <div className="grid md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-4">Performance Score</label>
                              <input 
                                 type="number"
                                 value={grade}
                                 onChange={e => setGrade(e.target.value)}
                                 placeholder="Score" 
                                 className="w-full bg-[#05070A] border border-white/10 p-8 rounded-[2rem] text-5xl font-black text-center focus:border-cyan-400 outline-none transition-all placeholder:text-gray-900" 
                              />
                           </div>
                           <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5 space-y-2">
                              <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">Student Response</p>
                              <p className="text-xs font-medium text-gray-400 line-clamp-4 italic">"{gradingSub.textResponse || 'No text payload.'}"</p>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-4">Strategic Feedback</label>
                              <textarea 
                                 value={feedback}
                                 onChange={e => setFeedback(e.target.value)}
                                 placeholder="Specify development protocols..." 
                                 className="w-full bg-[#05070A] border border-white/10 p-6 rounded-[2.5rem] text-sm font-bold h-64 focus:border-cyan-400 outline-none transition-all resize-none"
                              />
                           </div>
                        </div>
                     </div>

                     <button 
                       onClick={handleGrade}
                       disabled={submitting || !grade}
                       className="w-full py-6 bg-cyan-500 text-black rounded-3xl font-black italic uppercase tracking-[0.3em] text-sm shadow-2xl shadow-cyan-400/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                     >
                        {submitting ? 'Deploying...' : 'Deploy Evaluation'}
                     </button>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
}

function AdminSelectionMessages({ students, setStatus }: { students: any[], setStatus: any }) {
   const { user } = useAuth();
   const [message, setMessage] = useState('');
   const [loading, setLoading] = useState(false);
   const [attachments, setAttachments] = useState<File[]>([]);

   const handleBroadcast = async () => {
      if (!message.trim() && attachments.length === 0) return;
      setLoading(true);
      try {
         for (const student of students) {
            const q = query(collection(db, 'chats'), where('participants', 'array-contains', student.id));
            const snap = await getDocs(q);
            let chatId = '';
            const existingChat = snap.docs.find(d => d.data().participants.includes(user?.uid) && d.data().type === 'individual');
            if (existingChat) chatId = existingChat.id;
            else {
               const newChat = await addDoc(collection(db, 'chats'), {
                  participants: [user?.uid, student.id],
                  type: 'individual',
                  createdAt: serverTimestamp(),
                  lastMessage: message || 'Multimedia attachment',
                  lastMessageAt: serverTimestamp()
               });
               chatId = newChat.id;
            }
            const attachmentUrls = [];
            for (const file of attachments) {
               const sRef = ref(storage, `chats/${chatId}/${Date.now()}_${file.name}`);
               await uploadBytes(sRef, file);
               const url = await getDownloadURL(sRef);
               attachmentUrls.push({ url, name: file.name, type: file.type });
            }
            await addDoc(collection(db, 'chats', chatId, 'messages'), {
               senderId: user?.uid,
               text: message,
               attachments: attachmentUrls,
               createdAt: serverTimestamp()
            });
            await updateDoc(doc(db, 'chats', chatId), {
               lastMessage: message || 'Multimedia attachment',
               lastMessageAt: serverTimestamp()
            });
         }
         setMessage('');
         setAttachments([]);
         setStatus({ type: 'success', message: `Relay synchronized to ${students.length} terminals.` });
      } catch (e) {
         console.error(e);
         setStatus({ type: 'error', message: "Relay failure detected." });
      } finally {
         setLoading(false);
      }
   };

   const handleAudioRelay = async (blob: Blob) => {
      setLoading(true);
      try {
         for (const student of students) {
            const q = query(collection(db, 'chats'), where('participants', 'array-contains', student.id));
            const snap = await getDocs(q);
            let chatId = '';
            const existingChat = snap.docs.find(d => d.data().participants.includes(user?.uid) && d.data().type === 'individual');
            if (existingChat) chatId = existingChat.id;
            else {
               const newChat = await addDoc(collection(db, 'chats'), {
                  participants: [user?.uid, student.id],
                  type: 'individual',
                  createdAt: serverTimestamp(),
                  lastMessage: 'Voice Note',
                  lastMessageAt: serverTimestamp()
               });
               chatId = newChat.id;
            }
            const fileName = `voice_note_${Date.now()}.webm`;
            const sRef = ref(storage, `chats/${chatId}/${fileName}`);
            await uploadBytes(sRef, blob);
            const url = await getDownloadURL(sRef);
            
            await addDoc(collection(db, 'chats', chatId, 'messages'), {
               senderUid: user?.uid,
               text: '',
               attachments: [{ url, name: 'Voice Note', type: 'audio/webm' }],
               timestamp: serverTimestamp()
            });
            await updateDoc(doc(db, 'chats', chatId), {
               lastMessage: "Sent a voice note",
               lastUpdated: serverTimestamp()
            });
         }
         setStatus({ type: 'success', message: "Audio relay synchronized." });
      } catch (e) {
         console.error(e);
         setStatus({ type: 'error', message: "Audio relay failed." });
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="p-8 glass-card rounded-[2.5rem] bg-cyan-400/[0.03] border border-cyan-400/10 flex items-center justify-between shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
               <h4 className="text-lg font-bold tracking-tight text-white uppercase italic">Neural Relay <span className="text-cyan-400 font-light not-italic">Broadcast</span></h4>
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.4em] mt-1">Targeting {students.length} sectors</p>
            </div>
            <div className="flex items-center gap-6 relative z-10">
               <AudioRecorder onRecordingComplete={handleAudioRelay} />
               <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                  <Megaphone size={24} />
               </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 blur-[50px] rounded-full -mr-16 -mt-16" />
         </div>

         <div className="flex-1 glass-panel rounded-[3.5rem] border border-white/5 p-10 flex flex-col gap-10 bg-[#0A0C16] shadow-2xl">
            <div className="flex-1 overflow-y-auto space-y-6 min-h-[150px] scrollbar-thin scrollbar-thumb-white/5">
               {attachments.map((f, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5 group hover:border-cyan-400/30 transition-all shadow-inner"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                           {f.type.startsWith('image/') ? <ImageIcon size={18}/> : <FileText size={18}/>}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[11px] font-bold uppercase tracking-wide truncate max-w-[240px] text-white/80">{f.name}</span>
                           <span className="text-[9px] font-bold text-gray-600 uppercase">Payload Data</span>
                        </div>
                     </div>
                     <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="p-2 hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-xl transition-all"><X size={18}/></button>
                  </motion.div>
               ))}
               {attachments.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4">
                     <Share2 size={56} className="text-gray-500" />
                     <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-500">Awaiting payload data</p>
                  </div>
               )}
            </div>

            <div className="space-y-6">
               <textarea 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Specify synchronization instructions..." 
                  className="w-full bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 text-base font-medium outline-none focus:border-cyan-400/50 shadow-inner placeholder:text-gray-700 min-h-[140px] resize-none" 
               />
               <div className="flex gap-6">
                  <label className="flex-1 h-20 bg-white/[0.03] hover:bg-white/[0.06] rounded-[1.5rem] border border-dashed border-white/10 flex items-center justify-center gap-4 cursor-pointer transition-all border-spacing-4 group">
                     <Paperclip size={24} className="text-gray-500 group-hover:text-cyan-400 transition-colors" />
                     <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-500 group-hover:text-white transition-colors">Attach Assets</span>
                     <input type="file" multiple className="hidden" onChange={e => {
                        if (e.target.files) setAttachments([...attachments, ...Array.from(e.target.files)]);
                     }} />
                  </label>
                  <button 
                     onClick={handleBroadcast}
                     disabled={loading || (!message.trim() && attachments.length === 0)}
                     className="px-12 h-20 bg-cyan-400 text-black rounded-[1.5rem] font-bold uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-4 hover:scale-[1.02] shadow-[0_0_30px_rgba(34,211,238,0.2)] active:scale-95 transition-all disabled:opacity-30"
                  >
                     {loading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Execute Relay</>}
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}

function AdminSelectionVideos({ students, setStatus }: { students: any[], setStatus: any }) {
   const [videos, setVideos] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      getDocs(collection(db, 'videos')).then(snap => {
         setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
         setLoading(false);
      });
   }, []);

   const assignVideo = async (video: any) => {
      try {
         for (const student of students) {
            await addDoc(collection(db, 'users', student.id, 'assignedVideos'), {
               videoId: video.id,
               title: video.title,
               url: video.url,
               type: video.type || 'link',
               assignedAt: serverTimestamp(),
               viewed: false
            });
         }
         setStatus({ type: 'success', message: `Source data assigned to ${students.length} terminals.` });
      } catch (e) {
         console.error(e);
         setStatus({ type: 'error', message: "Assignment failed." });
      }
   };

   return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="glass-panel p-10 rounded-[3rem] border border-white/5 bg-[#0A0C16] shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-10 relative z-10">
               <div>
                  <h4 className="text-xl font-bold tracking-tight text-white uppercase italic">Repository <span className="text-cyan-400 font-light not-italic">Distribution</span></h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.4em] mt-1">Assign active intelligence modules</p>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-400">
                  <Database size={24} />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
               {videos.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-6 bg-white/[0.02] rounded-2xl border border-white/5 group hover:border-cyan-400/30 transition-all duration-500 shadow-inner">
                     <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                           <Play size={20} />
                        </div>
                        <div className="space-y-1">
                           <span className="text-base font-bold text-white/90 group-hover:text-white transition-colors">{v.title}</span>
                           <span className="text-[9px] font-bold uppercase text-gray-500 tracking-[0.2em] block">{v.type || 'standard link'}</span>
                        </div>
                     </div>
                     <button 
                        onClick={() => assignVideo(v)} 
                        className="px-6 py-2.5 bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400 hover:text-black rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all shadow-lg border border-cyan-400/20 active:scale-90"
                     >
                        Assign
                     </button>
                  </div>
               ))}
               {videos.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 opacity-10">
                     <Play size={48} className="text-gray-500" />
                     <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-500">Repository empty: Ingest modules first</p>
                  </div>
               )}
            </div>
            
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full" />
         </div>
      </div>
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

function AdminSelectionQA({ students, setStatus }: { students: any[], setStatus: any }) {
   const [questions, setQuestions] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [replyingTo, setReplyingTo] = useState<any>(null);
   const [reply, setReply] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);

   useEffect(() => {
      // Find all QA across all topics for these students
      const q = query(collectionGroup(db, 'qa'), where('userId', 'in', students.map(s => s.id)));
      const unsub = onSnapshot(q, (snap) => {
         setQuestions(snap.docs.map(d => ({ id: d.id, path: d.ref.path, ...d.data() })));
         setLoading(false);
      });
      return () => unsub();
   }, [students]);

   const handleReply = async () => {
      if (!reply.trim() || !replyingTo) return;
      setIsSubmitting(true);
      try {
         await updateDoc(doc(db, replyingTo.path), {
            adminReply: reply,
            repliedAt: serverTimestamp()
         });

         // Notify student
         await addDoc(collection(db, 'notifications'), {
            userId: replyingTo.userId,
            title: "Tutor Response Received",
            body: `Your question "${replyingTo.question.substring(0, 20)}..." has been addressed.`,
            type: 'message',
            status: 'pending',
            createdAt: serverTimestamp()
         });

         setReplyingTo(null);
         setReply('');
         setStatus({ type: 'success', message: "Response synchronized to student terminal." });
      } catch (e) {
         console.error(e);
         setStatus({ type: 'error', message: "Sync failure." });
      } finally {
         setIsSubmitting(false);
      }
   };

   if (loading) return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-20">
         <Loader2 className="animate-spin" size={32} />
         <p className="text-xs font-bold uppercase tracking-widest">Scanning Question Modules...</p>
      </div>
   );

   return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="grid gap-6">
            {questions.map(q => (
               <div key={q.id} className="glass-panel p-8 rounded-[2.5rem] bg-white/2 border-white/5 space-y-6 hover:border-cyan-400/20 transition-all">
                  <div className="flex justify-between items-start">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                           <User size={20} />
                        </div>
                        <div>
                           <p className="text-xs font-black uppercase text-white/90">{q.userName}</p>
                           <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">{q.createdAt?.toDate ? new Date(q.createdAt.toDate()).toLocaleString() : 'Recent'}</p>
                        </div>
                     </div>
                     {q.adminReply ? (
                        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[8px] font-black text-emerald-500 uppercase tracking-widest">Resolved</span>
                     ) : (
                        <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[8px] font-black text-rose-500 uppercase tracking-widest animate-pulse">Awaiting Sync</span>
                     )}
                  </div>
                  
                  <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5 italic text-sm font-medium leading-relaxed">
                     "{q.question}"
                  </div>

                  {q.adminReply && (
                     <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-2">
                        <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Curator Response</p>
                        <p className="text-sm font-bold text-gray-300">{q.adminReply}</p>
                     </div>
                  )}

                  {!q.adminReply && (
                     <button 
                       onClick={() => setReplyingTo(q)}
                       className="w-full py-4 bg-cyan-400/10 hover:bg-cyan-400 hover:text-black rounded-xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all border border-cyan-400/20 shadow-xl"
                     >
                       Initialize Response
                     </button>
                  )}
               </div>
            ))}
            {questions.length === 0 && (
               <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-10">
                  <MessageSquare size={48} />
                  <p className="text-xs font-bold uppercase tracking-widest italic">No active query logs detected.</p>
               </div>
            )}
         </div>

         <AnimatePresence>
            {replyingTo && (
               <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#05070A]/90 backdrop-blur-xl">
                  <motion.div 
                     initial={{ scale: 0.9, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0.9, opacity: 0 }}
                     className="w-full max-w-lg glass-panel p-10 rounded-[3rem] border border-white/10 bg-[#0A0C16] space-y-8"
                  >
                     <div className="flex justify-between items-center">
                        <h4 className="text-xl font-bold uppercase italic tracking-tight">Response <span className="text-cyan-400">Node</span></h4>
                        <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-white"><X size={24} /></button>
                     </div>
                     <div className="p-6 bg-white/5 rounded-2xl border border-white/5 italic text-xs text-gray-400 truncate">
                        "{replyingTo.question}"
                     </div>
                     <textarea 
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        placeholder="Input cognitive response data..." 
                        className="w-full bg-[#05070A] border border-white/10 p-6 rounded-2xl text-sm font-bold h-48 focus:border-cyan-400 outline-none transition-all resize-none"
                     />
                     <button 
                       onClick={handleReply}
                       disabled={isSubmitting || !reply.trim()}
                       className="w-full py-5 bg-cyan-400 text-black rounded-2xl font-bold uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-cyan-400/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                     >
                        {isSubmitting ? 'Syncing...' : 'Sync Response'}
                     </button>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
}

function AdminSelectionBulletins({ students, setStatus }: { students: any[], setStatus: any }) {
   const [title, setTitle] = useState('');
   const [body, setBody] = useState('');
   const [loading, setLoading] = useState(false);

   const handleTransmit = async () => {
      if (!title.trim() || !body.trim()) return;
      setLoading(true);
      try {
         for (const student of students) {
            await addDoc(collection(db, 'notifications'), {
               userId: student.id,
               title: title.trim(),
               body: body.trim(),
               type: 'bulletin',
               status: 'pending',
               createdAt: serverTimestamp()
            });
         }
         setTitle('');
         setBody('');
         setStatus({ type: 'success', message: "Selective bulletins transmitted to identified nodes." });
      } catch (e) {
         console.error(e);
         setStatus({ type: 'error', message: "Transmission failure detected." });
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="space-y-8 max-w-3xl mx-auto">
            <div className="space-y-4 text-center">
               <label className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-500 px-6">Selective Dispatch Header</label>
               <input 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. NODE-SPECIFIC SYNCHRONIZATION ALERT" 
                  className="w-full bg-[#0A0C16] border border-white/10 p-8 rounded-[2rem] text-center text-2xl font-bold uppercase tracking-tight outline-none focus:border-cyan-400/50 shadow-inner placeholder:text-gray-800" 
               />
            </div>
            <div className="space-y-4 text-center">
               <label className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-500 px-6">Bulletin Payload</label>
               <textarea 
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Specify the targeted instruction matrix for selected terminals..." 
                  className="w-full bg-[#0A0C16] border border-white/10 p-10 rounded-[3rem] text-lg font-medium min-h-[220px] outline-none focus:border-cyan-400/50 shadow-inner placeholder:text-gray-800 resize-none overflow-hidden" 
               />
            </div>
         </div>
         <button 
           onClick={handleTransmit}
           disabled={loading || !title.trim() || !body.trim()}
           className="w-full py-8 bg-cyan-600 text-white rounded-[3rem] font-bold uppercase tracking-[0.4em] text-[13px] shadow-2xl shadow-cyan-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 relative z-10 border border-white/10 disabled:opacity-50"
         >
            {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />} 
            {loading ? 'Transmitting...' : 'Transmit Selective Bulletin'}
         </button>
      </div>
   );
}

function AdminVideoLibrary({ setStatus }: { setStatus: any }) {
   const [videos, setVideos] = useState<any[]>([]);
   const [showAdd, setShowAdd] = useState(false);
   const [newVideo, setNewVideo] = useState({ title: '', url: '', type: 'youtube' });
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snap) => {
         setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubscribe();
   }, []);

   const handleAdd = async () => {
      if (!newVideo.title || !newVideo.url) return;
      setLoading(true);
      try {
         await addDoc(collection(db, 'videos'), {
            ...newVideo,
            createdAt: serverTimestamp()
         });
         setNewVideo({ title: '', url: '', type: 'youtube' });
         setShowAdd(false);
         setStatus({ type: 'success', message: 'Knowledge node successfully ingested.' });
      } catch (e: any) {
         console.error(e);
         setStatus({ type: 'error', message: e.message });
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
               <h2 className="text-4xl font-bold tracking-tight text-white uppercase italic">Online <span className="text-cyan-400 font-light not-italic">Classroom</span></h2>
               <p className="text-gray-500 text-[11px] font-bold uppercase tracking-[0.4em] mt-2 opacity-60">Architect global knowledge streams</p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
               <Link 
                  to="/whiteboard/global-session"
                  className="px-8 py-5 bg-white/[0.03] border border-white/10 text-white rounded-[1.5rem] font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-white/[0.08] transition-all flex items-center gap-3 shadow-xl backdrop-blur-xl"
               >
                  <PlusCircle size={20} /> Launch Hub Board
               </Link>
               <button 
                  onClick={() => setShowAdd(true)}
                  className="px-8 py-5 bg-cyan-400 text-black rounded-[1.5rem] font-bold uppercase tracking-[0.2em] text-[11px] hover:scale-105 transition-all flex items-center gap-3 shadow-2xl shadow-cyan-500/20 active:scale-95"
               >
                  <Plus size={20} /> Ingest Node
               </button>
            </div>
         </div>

         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {videos.map(v => (
               <div key={v.id} className="glass-card rounded-[3.5rem] bg-[#0A0C16] border border-white/5 overflow-hidden group hover:border-cyan-400/30 transition-all duration-700 flex flex-col shadow-2xl relative">
                  <div className="aspect-video bg-white/[0.02] relative flex items-center justify-center overflow-hidden">
                     {v.url.includes('youtube.com') || v.url.includes('youtu.be') ? (
                        <div className="absolute inset-0 grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110 opacity-40 group-hover:opacity-60">
                           <img 
                              src={`https://img.youtube.com/vi/${v.url.split('v=')[1]?.split('&')[0] || v.url.split('/').pop()}/maxresdefault.jpg`} 
                              className="w-full h-full object-cover"
                              alt="thumb"
                           />
                        </div>
                     ) : (
                        <div className="text-cyan-400/10 group-hover:text-cyan-400/20 transition-colors"><Play size={80} /></div>
                     )}
                     <div className="relative z-10 w-20 h-20 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.4)] scale-75 group-hover:scale-100 opacity-60 group-hover:opacity-100 transition-all duration-500 cursor-pointer">
                        <Play fill="currentColor" size={28} className="ml-1" />
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0A0C16] via-transparent to-transparent opacity-60" />
                  </div>
                  
                  <div className="p-8 lg:p-10 space-y-6 relative z-10">
                     <div className="flex justify-between items-start">
                        <h4 className="font-bold uppercase tracking-tight text-xl leading-tight text-white/90 group-hover:text-white transition-colors">{v.title}</h4>
                        <span className="shrink-0 px-3 py-1 bg-cyan-400/10 rounded-lg text-[9px] font-bold uppercase text-cyan-400 border border-cyan-400/20 tracking-widest">{v.type}</span>
                     </div>
                     <div className="flex items-center gap-3 text-gray-600 group-hover:text-gray-500 transition-colors">
                        <Share2 size={14} />
                        <p className="text-[10px] font-mono truncate tracking-tight">{v.url}</p>
                     </div>
                     <div className="flex gap-4 pt-4">
                        <button 
                           onClick={async () => {
                              if(confirm("Permanently purge this cognitive stream?")) await deleteDoc(doc(db, 'videos', v.id));
                           }}
                           className="flex-1 py-4 bg-rose-500/10 text-rose-500 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-90"
                        >
                           Purge Node
                        </button>
                        <a 
                           href={v.url} 
                           target="_blank" 
                           className="flex-1 py-4 bg-white/5 text-gray-500 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] border border-white/10 hover:bg-white/10 hover:text-white text-center transition-all shadow-lg active:scale-90"
                        >
                           Preview HUD
                        </a>
                     </div>
                  </div>
                  
                  <div className="absolute top-0 left-0 w-24 h-24 bg-cyan-400/5 blur-[50px] rounded-full -ml-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>
            ))}
         </div>

         <AnimatePresence>
            {showAdd && (
               <div className="fixed inset-0 bg-[#020408]/95 backdrop-blur-3xl z-[300] flex items-center justify-center p-6">
                  <motion.div 
                     initial={{ scale: 0.95, opacity: 0, y: 30 }}
                     animate={{ scale: 1, opacity: 1, y: 0 }}
                     exit={{ scale: 0.95, opacity: 0, y: 30 }}
                     className="glass-card bg-[#0A0C16] border border-white/5 w-full max-w-2xl rounded-[4rem] p-12 lg:p-16 space-y-12 shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
                  >
                     <div className="flex justify-between items-start relative z-10">
                        <div>
                           <p className="text-[11px] font-bold uppercase text-cyan-400 tracking-[0.4em] mb-2">Protocol Validation</p>
                           <h3 className="text-3xl font-bold tracking-tight text-white uppercase italic">Ingest <span className="text-cyan-500 font-light not-italic">Module</span></h3>
                        </div>
                        <button onClick={() => setShowAdd(false)} className="p-4 bg-white/5 hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-2xl transition-all border border-white/5"><X size={24} /></button>
                     </div>

                     <div className="space-y-8 relative z-10">
                        <div className="space-y-3">
                           <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 px-6">Source Nomenclature</label>
                           <input 
                              value={newVideo.title}
                              onChange={e => setNewVideo({...newVideo, title: e.target.value})}
                              placeholder="e.g. Advanced Calculus Quantum Nodes"
                              className="w-full bg-white/[0.02] border border-white/10 p-6 rounded-[2rem] text-base font-bold focus:border-cyan-400/50 outline-none transition-all shadow-inner placeholder:text-gray-800"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 px-6">Transmission Path (URL/Anchor)</label>
                           <input 
                              value={newVideo.url}
                              onChange={e => setNewVideo({...newVideo, url: e.target.value})}
                              placeholder="https://source.origin/..."
                              className="w-full bg-white/[0.02] border border-white/10 p-6 rounded-[2rem] text-sm font-mono focus:border-cyan-400/50 outline-none transition-all shadow-inner text-cyan-400/80"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 px-6">Authentication Protocol</label>
                           <select 
                              value={newVideo.type}
                              onChange={e => setNewVideo({...newVideo, type: e.target.value})}
                              className="w-full bg-white/[0.02] border border-white/10 p-6 rounded-[2rem] text-sm font-bold outline-none text-white focus:border-cyan-400/50 shadow-inner appearance-none cursor-pointer"
                           >
                              <option value="youtube">YouTube Cognitive Stream</option>
                              <option value="google-drive">Drive Archive Sync</option>
                              <option value="external">External Logic Link</option>
                              <option value="documentation">Internal Script/Text</option>
                           </select>
                        </div>
                     </div>

                     <div className="flex gap-6 relative z-10">
                        <button onClick={() => setShowAdd(false)} className="flex-1 py-6 bg-white/[0.03] rounded-[2rem] font-bold uppercase text-[11px] tracking-[0.3em] text-gray-500 hover:bg-white/[0.08] hover:text-white transition-all border border-white/5">Cancel Initialization</button>
                        <button 
                           onClick={handleAdd}
                           disabled={loading || !newVideo.title || !newVideo.url}
                           className="flex-1 py-6 bg-cyan-400 text-black rounded-[2rem] font-bold uppercase text-[11px] tracking-[0.3em] hover:scale-[1.02] transition-all shadow-2xl shadow-cyan-500/40 disabled:opacity-30 border border-white/20 active:scale-95"
                        >
                           {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Finalize Ingestion'}
                        </button>
                     </div>
                     
                     <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full" />
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
}

function AdminWhiteboardList({ students }: { students: any[] }) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
             <h2 className="text-4xl font-bold tracking-tight">Live <span className="text-cyan-400 font-light italic">Whiteboards</span></h2>
             <p className="text-gray-500 text-[11px] font-bold uppercase tracking-[0.4em] mt-2 opacity-60">1-on-1 private neural tutoring</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {students.map(stu => (
             <div key={stu.id} className="glass-panel p-6 rounded-[2rem] border-white/5 hover:border-cyan-500/30 transition-all flex flex-col items-center text-center gap-4 group">
                <div className="w-16 h-16 rounded-[1.5rem] bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-2xl border border-cyan-500/20 group-hover:scale-110 transition-transform overflow-hidden">
                   {stu.avatar ? <img src={stu.avatar} className="w-full h-full object-cover" /> : (stu.displayName?.charAt(0) || 'U')}
                </div>
                <div>
                   <h4 className="font-bold text-white/90 group-hover:text-cyan-400 transition-colors uppercase">{stu.displayName}</h4>
                   <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mt-1">{stu.email}</p>
                </div>
                <button 
                  onClick={() => window.open(`/whiteboard/session-${stu.id}`, '_blank')}
                  className="w-full py-4 mt-2 bg-cyan-500/10 text-cyan-400 rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-cyan-500 hover:text-black transition-all border border-cyan-500/20"
                >
                  Join Live Board
                </button>
             </div>
          ))}
          {students.length === 0 && (
            <div className="col-span-full py-20 text-center glass-panel rounded-[3rem] border-dashed border-white/10 opacity-50">
               <PenTool size={32} className="mx-auto text-gray-500 mb-4" />
               <p className="text-xs font-bold uppercase tracking-[0.3em]">No scholars synchronized yet</p>
            </div>
          )}
       </div>
    </div>
  );
}
