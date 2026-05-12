import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, where, doc, updateDoc, getDocs, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../AuthContext';
import { 
  MessageSquare, 
  X, 
  Send, 
  User, 
  Paperclip, 
  Smile, 
  Image as ImageIcon,
  Loader2,
  FileText,
  Download,
  Mic,
  Play as PlayIcon,
  Check as CheckIcon,
  BrainCircuit,
  Zap,
  Monitor
} from 'lucide-react';
import AudioRecorder from './AudioRecorder';
import Whiteboard from './Whiteboard';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleAudioRecording = async (blob: Blob) => {
    if (!chat || !user) return;
    setSending(true);
    try {
      const fileName = `voice_note_${Date.now()}.webm`;
      const sRef = ref(storage, `chats/${chat.id}/${fileName}`);
      await uploadBytes(sRef, blob);
      const url = await getDownloadURL(sRef);
      
      const attachment = { url, name: 'Voice Note', type: 'audio/webm' };

      await addDoc(collection(db, 'chats', chat.id, 'messages'), {
        senderUid: user.uid,
        text: '',
        attachments: [attachment],
        timestamp: serverTimestamp()
      });
      await updateDoc(doc(db, 'chats', chat.id), {
        lastMessage: "Sent a voice note",
        lastUpdated: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    // Find the chat with the admin
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      limit(1)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const chatDoc = snap.docs[0];
        setChat({ id: chatDoc.id, ...chatDoc.data() });
      }
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!chat) return;
    const q = query(
      collection(db, 'chats', chat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [chat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Simple unread logic: if closed, count new ones (simulated)
    if (!isOpen && messages.length > 0) {
      setUnreadCount(prev => prev + 1);
    }
    if (isOpen) setUnreadCount(0);
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !chat) return;
    setSending(true);
    const text = newMessage;
    const currentAttachments = [...attachments];
    setNewMessage('');
    setAttachments([]);
    
    try {
      const attachmentUrls = await Promise.all(currentAttachments.map(async (file) => {
        const sRef = ref(storage, `chats/${chat.id}/${Date.now()}_${file.name}`);
        await uploadBytes(sRef, file);
        const url = await getDownloadURL(sRef);
        return { url, name: file.name, type: file.type };
      }));

      await addDoc(collection(db, 'chats', chat.id, 'messages'), {
        senderUid: user?.uid,
        text,
        attachments: attachmentUrls,
        timestamp: serverTimestamp()
      });
      await updateDoc(doc(db, 'chats', chat.id), {
        lastMessage: text || (attachmentUrls.length > 0 ? "Sent an attachment" : ""),
        lastUpdated: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 md:bottom-12 md:right-12 z-[100]">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            className="absolute bottom-24 right-0 w-[95vw] md:w-[440px] h-[75vh] glass-panel bg-[#020408]/90 border-cyan-500/20 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,229,255,0.1)] flex flex-col overflow-hidden backdrop-blur-2xl"
          >
            {/* Header: Diagnostic Hub */}
            <div className="p-8 border-b border-white/5 bg-gradient-to-b from-cyan-500/10 to-transparent flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                     <BrainCircuit size={24} />
                  </div>
                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">Master Curator Node</h4>
                     <div className="flex items-center gap-3 mt-1">
                        <div className="flex gap-0.5">
                           {[1,2,3,4].map(i => <div key={i} className="w-1 h-1.5 rounded-full bg-emerald-500" />)}
                        </div>
                        <span className="text-[7px] font-mono text-emerald-500 uppercase font-black">Sync Verified</span>
                     </div>
                  </div>
               </div>
               <button 
                 onClick={() => setIsOpen(false)} 
                 className="w-10 h-10 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-gray-500 flex items-center justify-center transition-all border border-white/5"
               >
                  <X size={18} />
               </button>
            </div>

            {/* Neural Stream / Whiteboard */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide relative">
               {showWhiteboard ? (
                 <Whiteboard sessionId={chat?.id ? `session-${chat.id}` : 'global-chat'} />
               ) : (
                 <>
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 gap-6 opacity-20">
                        <div className="w-20 h-20 rounded-full border-4 border-dashed border-cyan-500 animate-[spin_10s_linear_infinite] flex items-center justify-center">
                          <Zap size={32} className="text-cyan-400" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed">Awaiting initial handshake with neural core...</p>
                    </div>
                  )}
                    {messages.map((msg, i) => {
                      const isMe = msg.senderUid === user.uid;
                      const pktId = msg.id?.substring(0, 8) || 'SYNCING';
                      
                      return (
                        <motion.div 
                          key={msg.id || i}
                          initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            "flex flex-col max-w-[85%] relative group",
                            isMe ? "ml-auto items-end" : "items-start"
                          )}
                        >
                          {/* Meta Header */}
                          <div className={cn(
                              "flex items-center gap-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity px-2",
                              isMe ? "flex-row-reverse" : "flex-row"
                          )}>
                              <span className="text-[7px] font-mono text-gray-600">PKT_{pktId}</span>
                              <div className="w-0.5 h-0.5 rounded-full bg-gray-700" />
                              <span className="text-[7px] font-mono text-gray-600">
                                {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...' }
                              </span>
                          </div>

                          {msg.attachments?.map((att: any, idx: number) => (
                              <div key={idx} className={cn(
                                "overflow-hidden rounded-3xl border shadow-2xl mb-2",
                                isMe ? "bg-cyan-500/20 border-cyan-500/40" : "bg-[#12141C] border-white/10"
                              )}>
                                {att.type?.startsWith('image/') ? (
                                    <img src={att.url} alt={att.name} className="max-w-full h-auto object-cover max-h-[300px] hover:scale-105 transition-transform cursor-pointer" />
                                ) : att.type?.startsWith('audio/') ? (
                                    <div className="p-6 flex items-center gap-6 min-w-[280px]">
                                      <button className="w-12 h-12 rounded-2xl bg-cyan-500 text-black flex items-center justify-center shadow-lg shadow-cyan-500/20 hover:scale-110 active:scale-95 transition-all">
                                          <PlayIcon size={18} fill="currentColor" />
                                      </button>
                                      <div className="flex-1 space-y-2">
                                          <div className="flex justify-between items-end">
                                            <p className="text-[7px] font-black uppercase tracking-widest text-cyan-400">Neural Voice Capture</p>
                                            <span className="text-[7px] font-mono text-gray-500">24KB</span>
                                          </div>
                                          <div className="h-1 bg-white/5 rounded-full w-full overflow-hidden">
                                            <div className="h-full bg-cyan-400 w-1/3 shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
                                          </div>
                                      </div>
                                      <audio src={att.url} className="hidden" />
                                    </div>
                                ) : (
                                    <div className="p-5 flex items-center gap-4 min-w-[240px]">
                                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-cyan-400 border border-white/5">
                                          <FileText size={20} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <p className="text-[10px] font-black truncate uppercase text-white/90 tracking-tight">{att.name}</p>
                                          <p className="text-[7px] font-mono text-gray-500 uppercase mt-1">{(att.type || 'FILE').split('/')[1] || 'DOC'} // ENCRYPTED</p>
                                      </div>
                                      <a href={att.url} target="_blank" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all">
                                          <Download size={16} />
                                      </a>
                                    </div>
                                )}
                              </div>
                          ))}

                          {msg.text && (
                            <div className={cn(
                              "p-6 rounded-[2rem] text-xs font-bold leading-relaxed shadow-2xl relative border transition-all",
                              isMe 
                                ? "bg-cyan-500 text-black rounded-tr-none border-cyan-400/50 shadow-cyan-500/10" 
                                : "bg-[#0A0C14] text-white/90 rounded-tl-none border-white/5 group-hover:border-white/10"
                            )}>
                                {msg.text}
                                
                                {/* Angle decoration */}
                                <div className={cn(
                                  "absolute -bottom-1 w-2 h-2",
                                  isMe ? "-right-1 bg-cyan-500" : "-left-1 bg-[#0A0C14] border-l border-b border-white/10"
                                )} style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} />
                            </div>
                          )}

                          <div className={cn("flex items-center gap-2 mt-2 px-1", isMe ? "justify-end" : "justify-start")}>
                              {isMe && <span className="text-[7px] font-black uppercase text-cyan-500 tracking-[0.2em] opacity-40">Sent</span>}
                              {!isMe && <span className="text-[7px] font-black uppercase text-purple-500 tracking-[0.2em] opacity-40">Verified</span>}
                          </div>
                        </motion.div>
                      );
                    })}
                 </>
               )}
            </div>

            {/* Input Terminal */}
            <div className="p-8 border-t border-white/5 bg-[#05070A]/80 space-y-6 backdrop-blur-xl">
               {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                     {attachments.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 animate-in fade-in zoom-in-95 duration-200">
                           <FileText size={10} />
                           <span className="text-[8px] font-black uppercase truncate max-w-[120px] tracking-tighter">{f.name}</span>
                           <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="hover:text-white transition-colors">
                              <X size={10} />
                           </button>
                        </div>
                     ))}
                  </div>
               )}
               <div className="flex items-center gap-4">
                  <div className="glass-panel px-6 py-2 rounded-[1.5rem] flex-1 flex items-center gap-4 bg-white/[0.03] border-white/10 focus-within:border-cyan-500/50 transition-all">
                     <label className="flex shrink-0 p-1 text-gray-500 hover:text-cyan-400 cursor-pointer transition-colors">
                        <Paperclip size={20} />
                        <input type="file" multiple className="hidden" onChange={e => {
                           if (e.target.files) setAttachments([...attachments, ...Array.from(e.target.files)]);
                        }} />
                     </label>
                     <input 
                       value={newMessage}
                       onChange={e => setNewMessage(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && sendMessage()}
                       placeholder="Transmit node data..."
                       className="flex-1 bg-transparent border-none outline-none py-4 text-sm font-bold text-white font-mono placeholder:text-gray-700"
                     />
                     <button 
                       onClick={() => setShowWhiteboard(!showWhiteboard)}
                       title="Switch to online board"
                       className={cn(
                         "p-1 transition-colors",
                         showWhiteboard ? "text-cyan-400" : "text-gray-500 hover:text-purple-400"
                       )}
                     >
                        <Monitor size={20} />
                     </button>
                  </div>
                  
                  {newMessage.trim() || attachments.length > 0 ? (
                    <button 
                      onClick={sendMessage} 
                      disabled={sending} 
                      className="w-14 h-14 bg-cyan-500 text-black rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(0,229,255,0.3)] group"
                    >
                       {sending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                    </button>
                  ) : (
                    <AudioRecorder onRecordingComplete={handleAudioRecording} />
                  )}
               </div>
               
               {/* Terminal Footer */}
               <div className="flex justify-between items-center px-2">
                  <div className="flex gap-4">
                     <div className="flex flex-col">
                        <span className="text-[6px] font-mono text-gray-700 uppercase">Input Node</span>
                        <span className="text-[8px] font-black text-gray-500 tracking-widest">LOCAL_SYS</span>
                     </div>
                     <div className="flex flex-col border-l border-white/10 pl-4">
                        <span className="text-[6px] font-mono text-gray-700 uppercase">Protocol</span>
                        <span className="text-[8px] font-black text-gray-500 tracking-widest italic">NEURAL_RELAY_v4</span>
                     </div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-pulse" />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all active:scale-95 group overflow-hidden border-2",
          isOpen ? "bg-rose-500/20 border-rose-500/40 scale-90" : "bg-[#020408]/80 border-cyan-500/30 hover:border-cyan-400 hover:scale-110"
        )}
      >
         <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
         {isOpen ? (
            <X className="text-rose-400 z-10" size={32} />
         ) : (
            <div className="relative z-10 flex flex-col items-center">
               <MessageSquare className="text-cyan-400" size={32} />
               {unreadCount > 0 && (
                  <div className="absolute -top-4 -right-4 w-6 h-6 bg-cyan-500 text-black rounded-full flex items-center justify-center text-[10px] font-black shadow-[0_0_15px_rgba(0,229,255,0.4)]">
                     {unreadCount}
                  </div>
               )}
            </div>
         )}
         
         {/* Orbit ring decorative */}
         {!isOpen && (
            <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-[spin_4s_linear_infinite] scale-110 opacity-40" style={{ borderStyle: 'dashed' }} />
         )}
      </button>
    </div>
  );
}
