/**
 * Main application router and core layout
 */
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Home, Compass, Trophy, User as UserIcon, LayoutDashboard, Brain, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import SubjectDetail from './pages/SubjectDetail';
import TopicView from './pages/TopicView';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Announcements from './pages/Announcements';
import { Megaphone, Users, CheckCircle, Video, MessageCircle, Monitor } from 'lucide-react';

// New Admin Pages
import MarkingCenter from './pages/admin/MarkingCenter';
import LiveBoard from './pages/admin/LiveBoard';
import WhiteboardRoom from './pages/WhiteboardRoom';
import ChatWidget from './components/ChatWidget';
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
  const { pathname } = useLocation();
  const { profile } = useAuth();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[#0A0C14] border-r border-white/10 p-6 z-50">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 ek-logo rounded-lg flex items-center justify-center font-bold text-xl italic text-white shadow-lg">
            EK
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-cyan-400 font-bold tracking-widest uppercase">ExamKraft</span>
            <span className="text-[10px] text-gray-500 font-medium uppercase">Mastery Engine</span>
          </div>
        </div>
        <nav className="flex-1 space-y-3">
          <Link to="/" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm uppercase tracking-wide", pathname === '/' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white hover:bg-white/5")}>
            <Home size={18} /> Dashboard
          </Link>
          <Link to="/discover" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm uppercase tracking-wide", pathname.startsWith('/discover') ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white hover:bg-white/5")}>
            <Compass size={18} /> Subjects
          </Link>
          <Link to="/leaderboard" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm uppercase tracking-wide", pathname === '/leaderboard' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white hover:bg-white/5")}>
            <Trophy size={18} /> Ranks
          </Link>
          <Link to="/announcements" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm uppercase tracking-wide", pathname === '/announcements' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white hover:bg-white/5")}>
            <Megaphone size={18} /> Bulletins
          </Link>
          <Link to="/profile" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm uppercase tracking-wide", pathname === '/profile' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white hover:bg-white/5")}>
            <UserIcon size={18} /> My Stats
          </Link>
          {profile?.role === 'admin' && (
            <Link to="/admin" className={cn("flex items-center gap-3 p-3 rounded-xl transition-all text-amber-500 border border-transparent font-bold text-sm uppercase tracking-wide", pathname === '/admin' ? "bg-amber-500/10 border-amber-500/20" : "hover:bg-white/5")}>
              <LayoutDashboard size={18} /> Admin Panel
            </Link>
          )}
        </nav>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0A0C14] border-t border-white/10 px-6 flex items-center justify-between z-50">
        <NavItem to="/" icon={Home} label="Home" active={pathname === '/'} />
        <NavItem to="/discover" icon={Compass} label="Courses" active={pathname.startsWith('/discover')} />
        <NavItem to="/leaderboard" icon={Trophy} label="Ranks" active={pathname === '/leaderboard'} />
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
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/marking" element={<MarkingCenter />} />
            <Route path="/admin/live-board" element={<LiveBoard />} />
            <Route path="/whiteboard/:sessionId" element={<WhiteboardRoom />} />
            <Route path="/payment-status" element={<PaymentStatus />} />
            <Route path="/verify/:certId" element={<VerifyCertificate />} />
          </Routes>
        </AnimatePresence>
      </main>
      {profile && profile.role !== 'admin' && <ChatWidget />}
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
