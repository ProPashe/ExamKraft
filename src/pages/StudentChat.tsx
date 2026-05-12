import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, where, doc, updateDoc, getDocs, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../AuthContext';
import { 
  Search, 
  MoreVertical, 
  MessageSquare, 
  Plus, 
  Mic, 
  Send, 
  Paperclip, 
  FileText,
  User,
  X,
  Loader2,
  CheckCheck,
  ChevronLeft,
  SquarePen,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Whiteboard from '../components/Whiteboard';

interface Message {
  id: string;
  senderUid: string;
  text: string;
  attachments?: any[];
  timestamp: any;
  status?: 'sent' | 'delivered' | 'read';
}

interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastUpdated: any;
  unreadCount?: number;
  tutorData?: any;
}

export default function StudentChat() {
  const { user } = useAuth();
  const [tutors, setTutors] = useState<any[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load tutors
  useEffect(() => {
    const fetchTutors = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'tutor'));
      const snap = await getDocs(q);
      const tutorList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Also add the main admin as a tutor if not present
      if (!tutorList.find(t => t.email === 'mudzimwapanashe123@gmail.com')) {
        const adminSnap = await getDocs(query(collection(db, 'users'), where('email', '==', 'mudzimwapanashe123@gmail.com')));
        if (!adminSnap.empty) {
          tutorList.push({ id: adminSnap.docs[0].id, ...adminSnap.docs[0].data(), name: 'Master Curator' });
        }
      }
      setTutors(tutorList);
    };
    fetchTutors();
  }, []);

  // Load chats for current student
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastUpdated', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const chatList = snap.docs.map(d => {
        const data = d.data();
        const tutorId = data.participants.find((p: string) => p !== user.uid);
        const tutor = tutors.find(t => t.id === tutorId);
        return {
          id: d.id,
          ...data,
          tutorData: tutor || { name: 'Expert Tutor', role: 'tutor' }
        } as Chat;
      });
      setChats(chatList);
    });

    return () => unsub();
  }, [user, tutors]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'chats', selectedChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });

    return () => unsub();
  }, [selectedChat]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startNewChat = async (tutor: any) => {
    if (!user) return;
    
    // Check if chat already exists
    const existing = chats.find(c => c.participants.includes(tutor.id));
    if (existing) {
      setSelectedChat(existing);
      return;
    }

    const newChatRef = await addDoc(collection(db, 'chats'), {
      participants: [user.uid, tutor.id],
      lastMessage: 'Conversation started',
      lastUpdated: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    setSelectedChat({
      id: newChatRef.id,
      participants: [user.uid, tutor.id],
      lastMessage: 'Conversation started',
      lastUpdated: new Date(),
      tutorData: tutor
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!selectedChat || !user) return;

    setSending(true);
    const text = newMessage;
    setNewMessage('');
    
    try {
      let uploadedAttachments: any[] = [];
      
      if (attachments.length > 0) {
        for (const file of attachments) {
          const sRef = ref(storage, `chats/${selectedChat.id}/${Date.now()}_${file.name}`);
          await uploadBytes(sRef, file);
          const url = await getDownloadURL(sRef);
          uploadedAttachments.push({
            url,
            name: file.name,
            type: file.type
          });
        }
        setAttachments([]);
      }

      await addDoc(collection(db, 'chats', selectedChat.id, 'messages'), {
        senderUid: user.uid,
        text,
        attachments: uploadedAttachments,
        timestamp: serverTimestamp(),
        status: 'sent'
      });

      await updateDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: text || "Sent an attachment",
        lastUpdated: serverTimestamp()
      });

    } catch (e) {
      console.error(e);
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen bg-[#111b21] flex overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "w-full md:w-[400px] border-r border-[#222e35] flex flex-col transition-all",
        selectedChat ? "hidden md:flex" : "flex"
      )}>
        {/* Profile Header */}
        <div className="bg-[#202c33] p-4 flex justify-between items-center h-[60px]">
          <div className="w-10 h-10 rounded-full bg-[#6a7175] flex items-center justify-center overflow-hidden">
            <User className="text-white/60" />
          </div>
          <div className="flex gap-4 text-[#aebac1]">
            <MessageSquare size={20} className="cursor-pointer" />
            <MoreVertical size={20} className="cursor-pointer" />
          </div>
        </div>

        {/* Search */}
        <div className="p-2 bg-[#111b21]">
          <div className="bg-[#202c33] rounded-lg px-4 flex items-center gap-4 py-1.5">
            <Search size={18} className="text-[#8696a0]" />
            <input 
              type="text" 
              placeholder="Search or start new chat"
              className="bg-transparent border-none outline-none text-sm text-[#d1d7db] w-full"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 opacity-60">Your Tutors</div>
          {chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={cn(
                "flex items-center gap-4 p-4 cursor-pointer border-b border-[#222e35] hover:bg-[#202c33] transition-colors",
                selectedChat?.id === chat.id ? "bg-[#2a3942]" : ""
              )}
            >
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 uppercase font-black">
                {chat.tutorData?.name?.charAt(0) || 'T'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="text-[#e9edef] font-medium truncate">{chat.tutorData?.name || 'Tutor'}</h4>
                  <span className="text-[10px] text-[#8696a0]">
                    {chat.lastUpdated?.toDate ? new Date(chat.lastUpdated.toDate()).toLocaleDateString() : ''}
                  </span>
                </div>
                <p className="text-sm text-[#8696a0] truncate">{chat.lastMessage}</p>
              </div>
            </div>
          ))}

          <div className="px-4 py-6 mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 opacity-60">Available Tutors</div>
          {tutors.filter(t => !chats.find(c => c.participants.includes(t.id))).map(tutor => (
             <div 
               key={tutor.id}
               onClick={() => startNewChat(tutor)}
               className="flex items-center gap-4 p-4 cursor-pointer border-b border-[#222e35] hover:bg-[#202c33] transition-colors"
             >
               <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 uppercase font-black">
                 {tutor.name?.charAt(0) || 'T'}
               </div>
               <div className="flex-1">
                 <h4 className="text-[#e9edef] font-medium">{tutor.name || 'Master Tutor'}</h4>
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Specialist Curator</p>
               </div>
               <Plus size={18} className="text-[#8696a0]" />
             </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#0b141a] relative",
        !selectedChat ? "hidden md:flex" : "flex"
      )}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-[#202c33] p-3 flex items-center justify-between h-[60px] z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedChat(null)} className="md:hidden text-[#aebac1]"><ChevronLeft /></button>
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 uppercase font-black text-xs border border-cyan-500/20">
                  {selectedChat.tutorData?.name?.charAt(0) || 'T'}
                </div>
                <div>
                  <h4 className="text-[#e9edef] text-sm font-medium">{selectedChat.tutorData?.name || 'Tutor'}</h4>
                  <span className="text-[10px] text-[#8696a0]">Online</span>
                </div>
              </div>
              <div className="flex gap-6 text-[#aebac1]">
                <Search size={20} className="cursor-pointer" />
                <MoreVertical size={20} className="cursor-pointer" />
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-fixed"
            >
              {showWhiteboard ? (
                <div className="h-full w-full bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300 relative flex flex-col">
                   <div className="bg-[#202c33] p-3 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <Monitor size={18} />
                         </div>
                         <h4 className="text-xs font-black uppercase tracking-widest text-white/90 italic">Neural <span className="text-purple-400">Classroom</span></h4>
                         <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded border border-white/5">Room: {selectedChat?.id ? `session-${selectedChat.id}` : 'global'}</span>
                      </div>
                      <button onClick={() => setShowWhiteboard(false)} className="text-[#8696a0] hover:text-white transition-colors"><X size={18} /></button>
                   </div>
                   <div className="flex-1 relative">
                      <Whiteboard sessionId={`session-${selectedChat.id}`} />
                   </div>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full py-20 opacity-50 text-center gap-4 pointer-events-none">
                      <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                        <MessageSquare size={28} />
                      </div>
                      <div>
                        <p className="font-black text-sm text-[#e9edef] uppercase tracking-widest">No messages yet</p>
                        <p className="text-[10px] text-[#8696a0] mt-1">Say hello to start your mastery session</p>
                      </div>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isMe = msg.senderUid === user?.uid;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id || i}
                        className={cn(
                          "flex w-full mb-1",
                          isMe ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[75%] p-2 px-3 rounded-lg text-sm shadow-sm relative group",
                          isMe ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none" : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
                        )}>
                          {msg.attachments?.map((at, idx) => (
                            <div key={idx} className="mb-2 rounded-lg overflow-hidden border border-white/5 bg-black/20">
                               {at.type?.startsWith('image/') ? (
                                 <img src={at.url} alt="attachment" className="max-w-full h-auto cursor-pointer" onClick={() => window.open(at.url)} />
                               ) : at.type?.startsWith('audio/') ? (
                                 <audio controls src={at.url} className="w-full h-10 p-2" />
                               ) : (
                                 <a href={at.url} target="_blank" className="p-4 flex items-center gap-3 text-cyan-400">
                                   <FileText size={20} />
                                   <span className="text-xs truncate">{at.name}</span>
                                 </a>
                               )}
                            </div>
                          ))}

                          <div className="flex flex-col">
                            <span>{msg.text}</span>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-[9px] text-[#8696a0]">
                                {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                              {isMe && (
                                <CheckCheck size={12} className={cn(msg.status === 'read' ? "text-[#53bdeb]" : "text-[#8696a0]")} />
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-2 px-4 bg-[#202c33] flex items-center gap-4">
              <div className="flex items-center gap-4 text-[#aebac1]">
                <button 
                  onClick={() => setShowWhiteboard(!showWhiteboard)}
                  title="Switch to online board"
                  className={cn(
                    "transition-colors",
                    showWhiteboard ? "text-[#00a884]" : "hover:text-white"
                  )}
                >
                  <SquarePen size={24} />
                </button>
                <Plus size={24} className="cursor-pointer hover:text-white" onClick={() => fileInputRef.current?.click()} />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  onChange={e => {
                    if (e.target.files) setAttachments([...attachments, ...Array.from(e.target.files)]);
                  }} 
                />
              </div>
              
              <div className="flex-1 relative">
                {attachments.length > 0 && (
                   <div className="absolute bottom-full left-0 mb-2 flex gap-2 flex-wrap">
                      {attachments.map((f, i) => (
                        <div key={i} className="bg-[#2a3942] p-2 rounded-lg flex items-center gap-2 text-xs border border-white/5">
                           <FileText size={14} />
                           <span className="truncate max-w-[100px]">{f.name}</span>
                           <X size={14} className="cursor-pointer text-[#8696a0]" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} />
                        </div>
                      ))}
                   </div>
                )}
                <input 
                  type="text" 
                  placeholder="Type a message"
                  className="w-full bg-[#2a3942] border-none outline-none text-sm text-[#d1d7db] py-2.5 px-4 rounded-lg placeholder:text-[#8696a0]"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
              </div>

              <div className="text-[#aebac1]">
                {newMessage.trim() || attachments.length > 0 ? (
                  <button onClick={sendMessage} disabled={sending} className="p-2">
                    {sending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="text-[#00a884]" />}
                  </button>
                ) : (
                  <Mic size={24} className="cursor-pointer hover:text-white" />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#222e35] p-10 text-center border-b-[6px] border-[#00a884]">
            <h2 className="text-[#e9edef] text-3xl font-light mb-4">Mastery Support</h2>
            <p className="text-[#8696a0] text-sm max-w-md leading-relaxed">
              Pick a tutor from the list to start your neural synchronization.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
