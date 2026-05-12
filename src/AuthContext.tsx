import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
import { subscribeToAuth, handleRedirectResult, ensureUserProfile, logout as authLogout, UserProfile } from './services/authService';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true, 
  authError: null,
  logout: async () => {} 
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // On app load, process result from a Google Sign-In redirect
  useEffect(() => {
    handleRedirectResult().then((err) => {
      if (err) {
        console.error('[Auth] Redirect error:', err);
        setAuthError(err);
      }
    }).catch((e) => {
      console.error('[Auth] Unhandled redirect error:', e);
      setAuthError(e?.message || 'An unexpected sign-in error occurred.');
    });
  }, []);

  useEffect(() => {
    const unsubscribeAuth = subscribeToAuth((u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    ensureUserProfile(user).catch((error) => {
      console.error('Error ensuring user profile:', error);
    });

    const userRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribeProfile();
  }, [user]);

  const logout = async () => {
    await authLogout();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, authError, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
