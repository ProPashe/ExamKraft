import React, { useState, useEffect, useCallback } from 'react';
import { Tldraw, useEditor } from 'tldraw';
import 'tldraw/tldraw.css';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { Loader2 } from 'lucide-react';

interface WhiteboardProps {
  sessionId: string;
}

import { useYjsStore } from '../hooks/useYjsStore';

export default function Whiteboard({ sessionId }: WhiteboardProps) {
  const { profile } = useAuth();
  const [loadingDb, setLoadingDb] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.email === 'mudzimwapanashe123@gmail.com';

  const store = useYjsStore({
    roomId: sessionId,
    hostUrl: 'wss://y-webrtc-signaling-eu.herokuapp.com'
  });

  useEffect(() => {
    if (!sessionId) return;
    const unsub = onSnapshot(doc(db, 'sessions', sessionId), (snap) => {
      if (!snap.exists()) {
        setIsReadOnly(!isAdmin);
        setLoadingDb(false);
        return;
      }
      const data = snap.data();
      setIsReadOnly(data.isLocked && !isAdmin);
      setLoadingDb(false);
    });
    return () => unsub();
  }, [sessionId, isAdmin]);

  if (loadingDb || store.status === 'loading') return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#05070A] gap-4">
      <Loader2 className="animate-spin text-cyan-400" size={48} />
      <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-500">Synchronizing Matrix...</p>
    </div>
  );

  return (
    <div className="absolute inset-0 bg-[#121212] overflow-hidden" style={{ width: '100%', height: '100%', position: 'absolute' }}>
      <Tldraw 
        store={store.store} 
        autoFocus 
        onMount={(editor) => {
          editor.updateInstanceState({ isReadonly: isReadOnly })
        }}
      />
    </div>
  );
}
