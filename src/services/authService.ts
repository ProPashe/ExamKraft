import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  getRedirectResult
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  avatar?: string;
  role: 'student' | 'tutor' | 'admin';
  xp: number;
  level: number;
  streak: number;
  lastLogin: any;
  enrolledSubjects: string[];
  badges: string[];
  createdAt: any;
}

export const ensureUserProfile = async (user: FirebaseUser) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  const adminEmail = (import.meta as any).env.VITE_ADMIN_EMAIL || 'mudzimwapanashe123@gmail.com';
  const role = user.email === adminEmail ? 'admin' : 'student';

  if (!userSnap.exists()) {
    const newUser: UserProfile = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      role,
      xp: 0,
      level: 1,
      streak: 1,
      lastLogin: serverTimestamp(),
      enrolledSubjects: [],
      badges: [],
      createdAt: serverTimestamp(),
    };

    await setDoc(userRef, newUser);

    if (role === 'admin') {
      await setDoc(doc(db, 'admins', user.uid), { active: true, email: user.email });
    }
  } else {
    await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
  }
};

export const handleRedirectResult = async (): Promise<string | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await ensureUserProfile(result.user);
    }
    return null;
  } catch (error: any) {
    console.error('[Auth] Redirect error:', error);
    if (error.code === 'auth/unauthorized-domain') {
       const host = window.location.hostname;
       return `Sign-in is not authorized for "${host}". Ask your admin to add this domain in Firebase Console → Authentication → Settings → Authorized Domains.`;
    }
    return error.message;
  }
};

export const loginWithGoogle = async (): Promise<string | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(result.user);
    return null;
  } catch (error: any) {
    console.error('Login error:', error);
    if (error.code === 'auth/popup-blocked') {
      return 'Popup was blocked by your browser. Please allow popups and try again.';
    }
    if (error.code === 'auth/unauthorized-domain') {
      const host = window.location.hostname;
      return `Sign-in is not authorized for "${host}". Ask your admin to add this domain in Firebase Console → Authentication → Settings → Authorized Domains.`;
    }
    if (error.code === 'auth/popup-closed-by-user') {
      return null;
    }
    return error.message || 'Sign-in failed. Please try again.';
  }
};

export const logout = () => signOut(auth);

export const subscribeToAuth = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
