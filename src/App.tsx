import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Home, Compass, Trophy, User as UserIcon, LayoutDashboard, BookOpen, RotateCcw, Settings, ShieldAlert, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import React, { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import SubjectDetail from './pages/SubjectDetail';
import TopicView from './pages/TopicView';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import StudentChat from './pages/StudentChat';

import { Megaphone, Users, CheckCircle, Video, MessageCircle, Monitor, MessageSquare } from 'lucide-react';

// New Admin Pages
import LiveBoard from './pages/admin/LiveBoard';
import WhiteboardRoom from './pages/WhiteboardRoom';
import PaymentStatus from './pages/PaymentStatus';
import VerifyCertificate from './pages/VerifyCertificate';

const NavItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link to={to} className={cn(
    "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-300",
    active ? "text-cyan-400 bg-cyan-400/10" : "text-slate-500 hover:text-slate-200"
  )}>
    <Icon className={cn("w-6 h-6", active && "animate-pulse")} />
    <span className="text-[10px] mt-1 font-bold uppercase tracking-tighter">{label}</span>
    {active && (
      <motion.div 
        layoutId="nav-active"
        className="absolute bottom-0 w-8 h-1 bg-cyan-400 rounded-t-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"
      />
    )}
  </Link>
);

const Navigation = () => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { profile, user, logout } = useAuth();
  const [isAdminMode, setIsAdminMode] = useState(pathname.startsWith('/admin'));
  
  const query = new URLSearchParams(search);
  const activeTab = query.get('tab') || 'home';

  const isAdmin = profile?.role === 'admin' || user?.email === 'mudzimwapanashe123@gmail.com';

  useEffect(() => {
    if (pathname.startsWith('/admin')) setIsAdminMode(true);
    else setIsAdminMode(false);
  }, [pathname]);

  const adminLinks = [
    { id: 'home', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'subjects', icon: BookOpen, label: 'Curriculum' },
    { id: 'requests', icon: Star, label: 'Requests' },
    { id: 'chat', icon: MessageSquare, label: 'Student Chat' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const studentLinks = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/discover', icon: Compass, label: 'Subjects' },
    { to: '/leaderboard', icon: Trophy, label: 'Ranks' },
    { to: '/chat', icon: MessageSquare, label: 'Tutor Chat' },

    { to: '/profile', icon: UserIcon, label: 'My Stats' },
  ];

  return (
    <>
      {/* Desktop Unified Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[#0A0C14] border-r border-white/5 p-6 z-50">
        {/* Branding */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20">
             <div className="w-full h-full rounded-[0.9rem] bg-[#0A0C14] flex items-center justify-center font-black italic text-xl">EK</div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.3em]">ExamKraft</span>
            <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">{isAdminMode ? 'Master Curator' : 'Mastery Engine'}</span>
          </div>
        </div>

        {/* Mode Switcher for Admins */}
        {isAdmin && (
          <div className="mb-8 p-1 bg-white/5 rounded-2xl flex items-center gap-1 border border-white/5">
             <button 
               onClick={() => { setIsAdminMode(false); navigate('/'); }}
               className={cn(
                 "flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                 !isAdminMode ? "bg-cyan-500 text-black shadow-lg" : "text-gray-500 hover:text-white"
               )}
             >
               Scholar
             </button>
             <button 
               onClick={() => { setIsAdminMode(true); navigate('/admin'); }}
               className={cn(
                 "flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                 isAdminMode ? "bg-amber-500 text-black shadow-lg" : "text-gray-500 hover:text-white"
               )}
             >
               Curator
             </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
          {isAdminMode ? (
            // Admin Links
            adminLinks.map(link => (
              <Link 
                key={link.id}
                to={`/admin?tab=${link.id}`}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-wider group relative",
                  activeTab === link.id
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]" 
                    : "text-slate-500 hover:text-white hover:bg-white/5"
                )}
              >
                <link.icon size={18} className={cn("transition-colors", activeTab === link.id ? "text-amber-500" : "group-hover:text-amber-500")} /> 
                {link.label}
                {activeTab === link.id && (
                  <motion.div layoutId="active-nav-glow" className="absolute right-4 w-1 h-4 bg-amber-500 rounded-full shadow-[0_0_10px_#f59e0b]" />
                )}
              </Link>
            ))
          ) : (
            // Student Links
            <>
              {studentLinks.map(link => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-wider group relative", 
                    pathname === link.to 
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]" 
                      : "text-slate-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <link.icon size={18} className={cn("transition-colors", pathname === link.to ? "text-cyan-400" : "group-hover:text-cyan-400")} /> 
                  {link.label}
                  {pathname === link.to && (
                    <motion.div layoutId="active-nav-glow" className="absolute right-4 w-1 h-4 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]" />
                  )}
                </Link>
              ))}
              
              {isAdmin && (
                <div className="pt-6 mt-6 border-t border-white/5">
                  <Link to="/admin" className="flex items-center gap-4 p-4 rounded-2xl text-amber-500/60 hover:text-amber-500 hover:bg-amber-500/5 transition-all font-bold text-[11px] uppercase tracking-wider border border-dashed border-amber-500/20">
                    <LayoutDashboard size={18} /> Curator Access
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="pt-6 border-t border-white/5">
          <button onClick={logout} className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/5 transition-all font-bold text-[11px] uppercase tracking-wider group">
             <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" /> Disconnect
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#0A0C14]/80 backdrop-blur-2xl border-t border-white/5 px-6 flex items-center justify-between z-50">
        <NavItem to="/" icon={Home} label="Home" active={pathname === '/'} />
        <NavItem to="/discover" icon={Compass} label="Courses" active={pathname.startsWith('/discover')} />
        <NavItem to="/leaderboard" icon={Trophy} label="Ranks" active={pathname === '/leaderboard'} />
        <NavItem to="/chat" icon={MessageSquare} label="Tutor" active={pathname === '/chat'} />
        {isAdmin && <NavItem to="/admin" icon={ShieldAlert} label="Admin" active={pathname.startsWith('/admin')} />}
        <NavItem to="/profile" icon={UserIcon} label="Me" active={pathname === '/profile'} />
      </nav>
    </>
  );
};

const AppContent = () => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user && location.pathname !== '/auth') {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {user && location.pathname !== '/auth' && <Navigation />}
      <main className={cn(
        "transition-all duration-300",
        user && location.pathname !== '/auth' ? "md:ml-64 pb-20 md:pb-0" : ""
      )}>
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route path="/auth" element={<Landing />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/discover/:subjectId" element={<SubjectDetail />} />
            <Route path="/topic/:subjectId/:topicId" element={<TopicView />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />

            <Route path="/admin" element={<Admin />} />
            <Route path="/chat" element={<StudentChat />} />
            <Route path="/admin/live-board" element={<LiveBoard />} />
            <Route path="/whiteboard/:sessionId" element={<WhiteboardRoom />} />
            <Route path="/payment-status" element={<PaymentStatus />} />
            <Route path="/verify/:certId" element={<VerifyCertificate />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
