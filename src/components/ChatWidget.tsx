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
  Check as CheckIcon
} from 'lucide-react';
import AudioRecorder from './AudioRecorder';
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
      const attachmentUrls = [];
      for (const file of currentAttachments) {
        const sRef = ref(storage, `chats/${chat.id}/${Date.now()}_${file.name}`);
        await uploadBytes(sRef, file);
        const url = await getDownloadURL(sRef);
        attachmentUrls.push({ url, name: file.name, type: file.type });
      }

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
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[90vw] md:w-[400px] h-[70vh] glass-panel bg-[#0A0C14] border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-white/2 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                     <User size={20} />
                  </div>
                  <div>
                     <h4 className="text-sm font-black uppercase tracking-tight">Master Tutor</h4>
                     <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Online Link</span>
                     </div>
                  </div>
               </div>
               <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500 hover:text-white transition-all">
                  <X size={20} />
               </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
               {messages.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-30 italic">
                    <MessageSquare size={40} />
                    <p className="text-xs font-bold leading-relaxed">Initializing secure link with tutor node...</p>
                 </div>
               )}
                {messages.map((msg, i) => {
                  const isMe = msg.senderUid === user.uid;
                  return (
                    <div key={msg.id} className={cn(
                      "flex flex-col max-w-[85%] relative",
                      isMe ? "ml-auto items-end" : "items-start"
                    )}>
                       {msg.attachments?.map((att: any, idx: number) => (
                          <div key={idx} className={cn(
                             "overflow-hidden rounded-2xl border border-white/5 shadow-lg",
                             isMe ? "bg-cyan-600/90" : "bg-white/10"
                          )}>
                             {att.type?.startsWith('image/') ? (
                                <img src={att.url} alt={att.name} className="max-w-full h-auto object-cover max-h-[300px]" />
                             ) : att.type?.startsWith('audio/') ? (
                                <div className="p-4 flex items-center gap-4 min-w-[240px]">
                                   <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-cyan-400">
                                      <PlayIcon size={16} fill="currentColor" />
                                   </div>
                                   <div className="flex-1 space-y-1">
                                      <div className="h-1 bg-white/10 rounded-full w-full overflow-hidden">
                                         <div className="h-full bg-cyan-400 w-0" />
                                      </div>
                                      <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Voice Note</p>
                                   </div>
                                   <audio src={att.url} className="hidden" />
                                   <a href={att.url} target="_blank" className="p-2 hover:bg-white/5 rounded-lg text-gray-400">
                                      <Download size={14} />
                                   </a>
                                </div>
                             ) : (
                                <div className="p-4 flex items-center gap-3 min-w-[200px]">
                                   <div className="p-2 bg-white/10 rounded-xl text-cyan-400">
                                      <FileText size={18} />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-black truncate uppercase">{att.name}</p>
                                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{(att.type || 'FILE').split('/')[1] || 'DOC'}</p>
                                   </div>
                                   <a href={att.url} target="_blank" className="p-2 hover:bg-white/5 rounded-lg text-gray-400">
                                      <Download size={14} />
                                   </a>
                                </div>
                             )}
                          </div>
                       ))}
                       {msg.text && (
                         <div className={cn(
                           "p-4 rounded-2xl text-xs font-bold leading-relaxed shadow-lg relative",
                           isMe ? "bg-cyan-500 text-black rounded-tr-none" : "bg-[#1F2C33] text-white rounded-tl-none border border-white/5"
                         )}>
                            {msg.text}
                         </div>
                       )}
                       <div className="flex items-center gap-2 mt-1 px-1">
                          <span className="text-[8px] font-black text-gray-600 uppercase">
                            {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                          </span>
                          {isMe && <div className="flex items-center text-cyan-400 opacity-60"><CheckIcon size={10} /><CheckIcon size={10} className="-ml-1" /></div>}
                       </div>
                    </div>
                  );
                })}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-white/5 bg-white/2 space-y-4">
               {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                     {attachments.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                           <span className="text-[8px] font-black uppercase truncate max-w-[100px]">{f.name}</span>
                           <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="text-rose-500"><X size={10} /></button>
                        </div>
                     ))}
                  </div>
               )}
               <div className="flex items-center gap-2">
                  <div className="glass-panel px-4 py-1 rounded-2xl flex-1 flex items-center gap-3 bg-white/2 relative">
                     <label className="flex shrink-0 p-1 text-gray-500 hover:text-cyan-400 cursor-pointer">
                        <Paperclip size={18} />
                        <input type="file" multiple className="hidden" onChange={e => {
                           if (e.target.files) setAttachments([...attachments, ...Array.from(e.target.files)]);
                        }} />
                     </label>
                     <input 
                       value={newMessage}
                       onChange={e => setNewMessage(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && sendMessage()}
                       placeholder="Type relayed message..."
                       className="flex-1 bg-transparent border-none outline-none py-3 text-sm font-bold"
                     />
                     <button className="p-1 text-gray-500 hover:text-cyan-400"><Smile size={18} /></button>
                  </div>
                  
                  {newMessage.trim() || attachments.length > 0 ? (
                    <button onClick={sendMessage} disabled={sending} className="w-12 h-12 bg-cyan-500 text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20">
                       {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  ) : (
                    <AudioRecorder onRecordingComplete={handleAudioRecording} />
                  )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all active:scale-95 group overflow-hidden",
          isOpen ? "bg-rose-500 scale-90" : "bg-cyan-500 hover:scale-110"
        )}
      >
         <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
         {isOpen ? <X className="text-white" size={32} /> : <MessageSquare className="text-black" size={32} />}
         {unreadCount > 0 && !isOpen && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-600 border-4 border-[#05070A] rounded-full flex items-center justify-center text-[10px] font-black text-white">
               {unreadCount}
            </div>
         )}
      </button>
    </div>
  );
}
