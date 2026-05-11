import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Users, Shield, ShieldAlert, Lock, Unlock, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, collection, addDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import AudioRecorder from '../components/AudioRecorder';

const Whiteboard = lazy(() => import('../components/Whiteboard'));

import BackButton from '../components/BackButton';

export default function WhiteboardRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { profile, user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [audioNotes, setAudioNotes] = useState<any[]>([]);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  
  const isAdmin = profile?.role === 'admin' || profile?.email === 'mudzimwapanashe123@gmail.com';

  useEffect(() => {
    if (!sessionId || !user) return;

    const unsub = onSnapshot(doc(db, 'sessions', sessionId), async (snap) => {
      if (!snap.exists()) {
        if (isAdmin) {
          // Initialize session if admin
          await setDoc(doc(db, 'sessions', sessionId), {
            hostUid: user.uid,
            hostName: profile?.displayName || profile?.email,
            createdAt: serverTimestamp(),
            isLocked: false,
            participants: [user.uid]
          });
        }
      } else {
        setSession(snap.data());
      }
      setLoading(false);
    });

    return () => unsub();
  }, [sessionId, user, isAdmin, profile]);

  useEffect(() => {
    if (!sessionId) return;
    const q = query(collection(db, 'sessions', sessionId, 'audioNotes'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setAudioNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [sessionId]);

  const handleRecordingComplete = async (blob: Blob) => {
    if (!sessionId || !user) return;
    setIsUploadingAudio(true);
    try {
      const audioRef = ref(storage, `sessions/${sessionId}/audio/${Date.now()}.webm`);
      await uploadBytes(audioRef, blob);
      const url = await getDownloadURL(audioRef);
      
      await addDoc(collection(db, 'sessions', sessionId, 'audioNotes'), {
        url,
        senderId: user.uid,
        senderName: profile?.displayName || profile?.email || 'User',
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Audio upload failed", e);
      alert("Failed to send audio note.");
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const toggleLock = async () => {
    if (!isAdmin || !sessionId) return;
    await updateDoc(doc(db, 'sessions', sessionId), {
      isLocked: !session?.isLocked
    });
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Terminal Invite String copied to clipboard.");
  };

  if (loading) return (
    <div className="h-screen w-screen bg-[#05070A] flex flex-col items-center justify-center gap-6">
       <Loader2 className="animate-spin text-cyan-400" size={64} />
       <div className="space-y-1 text-center">
          <p className="text-xl font-black uppercase italic tracking-tighter text-white">Establishing <span className="text-cyan-400">Neural Link</span></p>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">Syncing with remote host...</p>
       </div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-[#05070A] relative overflow-hidden">
       {/* Background Whiteboard */}
       <div className="absolute inset-0 z-0">
          <Suspense fallback={
            <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-[#0A0C14]">
               <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-700">Initializing Neural Interface...</p>
            </div>
          }>
             {sessionId && <Whiteboard sessionId={sessionId} />}
          </Suspense>
       </div>

       {/* Toolbar */}
       <header className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pointer-events-none">
          <div className="flex items-center gap-4 md:gap-6 pointer-events-auto">
             <BackButton to={isAdmin ? "/admin" : "/dashboard"} label="Exit Node" />
             <div className="bg-[#0A0C14]/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <h1 className="text-sm md:text-base font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
                   Training <span className="text-cyan-400">Node</span> 
                   <span className="hidden sm:inline text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 rounded-full border border-white/5 text-gray-600">ID: {sessionId?.substring(0, 8)}</span>
                </h1>
             </div>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
             {isAdmin && (
                <button 
                  onClick={toggleLock}
                  className={`p-3 rounded-2xl transition-all border flex items-center gap-2 backdrop-blur-md ${session?.isLocked ? 'bg-rose-500/20 border-rose-500/30 text-rose-500' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500'}`}
                >
                   {session?.isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                   <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">{session?.isLocked ? 'Writing Restricted' : 'Writing Permitted'}</span>
                </button>
             )}

             <div className="hidden md:flex items-center gap-2 px-4 py-3 glass-panel rounded-2xl border-white/10 bg-[#0A0C14]/80 backdrop-blur-md">
                {isAdmin ? <Shield size={16} className="text-cyan-400" /> : <ShieldAlert size={16} className="text-amber-500" />}
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                   {isAdmin ? 'Host Privilege Active' : (session?.isLocked ? 'Observation Mode' : 'Collaboration Mode')}
                </span>
             </div>
             
             <button 
               onClick={copyInvite}
               className="p-3 bg-cyan-500 rounded-2xl text-black hover:scale-105 transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
             >
                <Share2 size={18} />
                <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Share Invite</span>
             </button>
          </div>
       </header>

       {/* Floating Audio Notes Panel */}
       <div className="absolute top-24 right-4 md:right-6 z-10 w-64 max-h-[60vh] overflow-y-auto pointer-events-none flex flex-col gap-2">
          {audioNotes.map(note => (
            <div key={note.id} className="p-3 rounded-2xl bg-[#0A0C14]/90 backdrop-blur-xl border border-white/10 pointer-events-auto flex flex-col gap-2 shadow-xl shadow-black/50">
               <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">{note.senderName}</span>
               <audio src={note.url} controls className="w-full h-8 [&::-webkit-media-controls-panel]:bg-white/5 [&::-webkit-media-controls-play-button]:text-cyan-400" />
            </div>
          ))}
       </div>

       {/* Bottom Controls Overlay */}
       <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 right-6 md:right-10 flex justify-between items-end z-10 pointer-events-none">
          {/* Participants */}
          <div className="p-2 md:p-4 glass-panel rounded-2xl bg-[#0A0C14]/80 backdrop-blur-xl border border-white/10 flex items-center gap-2 md:gap-4 pointer-events-auto shadow-xl shadow-black/50">
             <div className="flex items-center gap-2 px-2 md:px-3 py-1 bg-cyan-400/10 rounded-lg text-cyan-400">
                <Users size={12} className="md:w-[14px]" />
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest leading-none">Live</span>
             </div>
             <div className="flex -space-x-2 md:-space-x-3">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-cyan-500 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-black">A</div>
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-500 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white">S</div>
             </div>
          </div>

          {/* Audio Recorder */}
          <div className="pointer-events-auto bg-[#0A0C14]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-xl shadow-black/50 p-1 flex items-center gap-3">
             <AudioRecorder onRecordingComplete={handleRecordingComplete} />
             {isUploadingAudio && <Loader2 className="animate-spin text-cyan-400 mr-4" size={16} />}
          </div>
       </div>
    </div>
  );
}
