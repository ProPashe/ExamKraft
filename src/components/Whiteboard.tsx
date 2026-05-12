import React, { useState, useEffect } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { Loader2 } from 'lucide-react';
import { useYjsStore } from '../hooks/useYjsStore';

interface WhiteboardProps {
  sessionId: string;
}

export default function Whiteboard({ sessionId }: WhiteboardProps) {
  const { profile, user } = useAuth();
  const [loadingDb, setLoadingDb] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const isGlobalAdmin = profile?.role === 'admin' || profile?.email === 'mudzimwapanashe123@gmail.com';

  const store = useYjsStore({
    roomId: sessionId,
    hostUrl: 'wss://signaling.yjs.dev'
  });

  useEffect(() => {
    if (!sessionId || !user) return;
    const unsub = onSnapshot(doc(db, 'sessions', sessionId), (snap) => {
      if (!snap.exists()) {
        setIsReadOnly(false); // Default to collaborative
        setLoadingDb(false);
        return;
      }
      const data = snap.data();
      const isActuallyAdmin = isGlobalAdmin || data.hostUid === user.uid;
      setIsReadOnly(data.isLocked && !isActuallyAdmin);
      setLoadingDb(false);
    });
    return () => unsub();
  }, [sessionId, isGlobalAdmin, user]);

  const [editor, setEditor] = useState<any>(null);

  useEffect(() => {
    if (editor) {
      editor.updateInstanceState({ isReadonly: isReadOnly });
    }
  }, [editor, isReadOnly]);

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
        onMount={(e) => {
          setEditor(e);
        }}
      />
    </div>
  );
}
