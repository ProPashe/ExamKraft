import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, where, doc, updateDoc, limit } from 'firebase/firestore';
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
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Whiteboard from '../components/Whiteboard';
import { SquarePen } from 'lucide-react';

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
  studentData?: any;
}

export default function AdminChat({ students }: { students: any[] }) {
  const { user } = useAuth();
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

  // Load chats
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
        const studentId = data.participants.find((p: string) => p !== user.uid);
        const student = students.find(s => s.id === studentId);
        return {
          id: d.id,
          ...data,
          studentData: student
        } as Chat;
      });
      setChats(chatList);
    });

    return () => unsub();
  }, [user, students]);

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

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedChat || !user) return;
    setSending(true);
    const text = newMessage;
    const currentAttachments = [...attachments];
    setNewMessage('');
    setAttachments([]);

    try {
      const attachmentUrls = await Promise.all(currentAttachments.map(async (file) => {
        const sRef = ref(storage, `chats/${selectedChat.id}/${Date.now()}_${file.name}`);
        await uploadBytes(sRef, file);
        const url = await getDownloadURL(sRef);
        return { url, name: file.name, type: file.type };
      }));

      await addDoc(collection(db, 'chats', selectedChat.id, 'messages'), {
        senderUid: user.uid,
        text,
        attachments: attachmentUrls,
        timestamp: serverTimestamp(),
        status: 'sent'
      });

      await updateDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: text || (attachmentUrls.length > 0 ? "Sent an attachment" : ""),
        lastUpdated: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const filteredChats = chats.filter(c => 
    c.studentData?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.studentData?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] bg-[#111b21] rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
      {/* Left Sidebar */}
      <div className={cn(
        "w-full md:w-[400px] border-r border-[#202c33] flex flex-col bg-[#111b21]",
        selectedChat ? "hidden md:flex" : "flex"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 bg-[#202c33] flex items-center justify-between">
          <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden border border-white/10">
            {user?.photoURL ? <img src={user.photoURL} alt="Admin" /> : <User className="text-gray-400 p-2" />}
          </div>
          <div className="flex items-center gap-6 text-[#aebac1]">
            <MessageSquare size={20} className="cursor-pointer hover:text-white transition-colors" />
            <MoreVertical size={20} className="cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-2 px-3">
          <div className="bg-[#202c33] rounded-lg flex items-center px-4 py-1.5">
            <Search size={16} className="text-[#8696a0] mr-4" />
            <input 
              type="text" 
              placeholder="Search or start a new chat"
              className="bg-transparent border-none outline-none text-sm text-[#d1d7db] w-full placeholder:text-[#8696a0]"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>



        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredChats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={cn(
                "flex items-center p-3 cursor-pointer border-b border-[#202c33] hover:bg-[#202c33] transition-all",
                selectedChat?.id === chat.id ? "bg-[#2a3942]" : ""
              )}
            >
              <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden mr-4 shrink-0">
                {chat.studentData?.avatar ? <img src={chat.studentData.avatar} alt="Student" className="w-full h-full object-cover" /> : <User className="text-gray-500 p-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-[#e9edef] font-medium truncate">{chat.studentData?.displayName || 'Student'}</h4>
                  <span className="text-[10px] text-[#8696a0]">
                    {chat.lastUpdated?.toDate ? new Date(chat.lastUpdated.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-[#8696a0] truncate">{chat.lastMessage}</p>
                  {chat.unreadCount ? (
                    <span className="bg-[#00a884] text-[#111b21] rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                      {chat.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#0b141a] relative",
        !selectedChat ? "hidden md:flex" : "flex"
      )}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-3 bg-[#202c33] flex items-center justify-between">
              <div className="flex items-center">
                <button onClick={() => setSelectedChat(null)} className="md:hidden text-[#aebac1] mr-2">
                  <ChevronLeft size={24} />
                </button>
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden mr-3">
                  {selectedChat.studentData?.avatar ? <img src={selectedChat.studentData.avatar} alt="Student" className="w-full h-full object-cover" /> : <User className="text-gray-500 p-2" />}
                </div>
                <div>
                  <h4 className="text-[#e9edef] text-sm font-medium">{selectedChat.studentData?.displayName || 'Student'}</h4>
                  <p className="text-[10px] text-[#8696a0]">last seen today at 1:49 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-[#aebac1]">
                <Search size={20} className="cursor-pointer hover:text-white" />
                <MoreVertical size={20} className="cursor-pointer hover:text-white" />
              </div>
            </div>

            {/* Messages Area / Whiteboard */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 md:p-10 space-y-2 bg-[#0b141a] relative"
              style={{
                backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")'
              }}
            >
              <div className="absolute inset-0 bg-[#0b141a]/90 pointer-events-none" />
              
              {showWhiteboard ? (
                <div className="absolute inset-0 z-20 bg-slate-900 flex flex-col">
                   <div className="bg-[#202c33] p-3 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <Monitor size={18} />
                         </div>
                         <h4 className="text-xs font-black uppercase tracking-widest text-white/90 italic">Neural <span className="text-purple-400">Classroom</span></h4>
                         <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded border border-white/5 ml-2">Room: {selectedChat?.id ? `session-${selectedChat.id}` : 'global'}</span>
                      </div>
                      <button onClick={() => setShowWhiteboard(false)} className="text-[#8696a0] hover:text-white transition-colors"><X size={18} /></button>
                   </div>
                   <div className="flex-1 relative">
                      <Whiteboard sessionId={selectedChat?.id ? `session-${selectedChat.id}` : 'global-chat'} />
                   </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => {
                    const isMe = msg.senderUid === user?.uid;
                    return (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex flex-col relative z-10",
                          isMe ? "items-end" : "items-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[85%] md:max-w-[65%] p-2 px-3 rounded-lg text-sm shadow-md relative group",
                          isMe ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none" : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
                        )}>
                          {/* Message Tail */}
                          <div className={cn(
                            "absolute top-0 w-3 h-3",
                            isMe ? "-right-2 bg-[#005c4b]" : "-left-2 bg-[#202c33]"
                          )} style={{ clipPath: isMe ? 'polygon(0 0, 0 100%, 100% 0)' : 'polygon(100% 0, 100% 100%, 0 0)' }} />

                          {msg.attachments?.map((att, idx) => (
                            <div key={idx} className="mb-2 rounded-md overflow-hidden">
                              {att.type?.startsWith('image/') ? (
                                <img src={att.url} alt={att.name} className="max-w-full h-auto cursor-pointer" />
                              ) : (
                                <div className="p-3 bg-black/20 rounded flex items-center gap-3">
                                  <FileText size={20} className="text-[#8696a0]" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs truncate">{att.name}</p>
                                    <p className="text-[10px] text-[#8696a0]">{(att.type || '').split('/')[1]?.toUpperCase()}</p>
                                  </div>
                                  <a href={att.url} target="_blank" className="text-[#8696a0] hover:text-white">
                                    <Send size={14} className="rotate-90" />
                                  </a>
                                </div>
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
            <h2 className="text-[#e9edef] text-3xl font-light mb-4">Welcome</h2>
            <p className="text-[#8696a0] text-sm max-w-md leading-relaxed">
              Pick any chat to start talking
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


