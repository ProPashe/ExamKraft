import { 
  signInWithPopup,
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
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

const createOrUpdateProfile = async (user: FirebaseUser) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const adminEmail = (import.meta as any).env.VITE_ADMIN_EMAIL || 'mudzimwapanashe123@gmail.com';
    const role = user.email === adminEmail ? 'admin' : 'student';

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

// No-op — kept for AuthContext compatibility (was used for redirect flow)
export const handleRedirectResult = async (): Promise<string | null> => {
  return null;
};

export const loginWithGoogle = async (): Promise<string | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await createOrUpdateProfile(result.user);
    return null; // success
  } catch (error: any) {
    console.error('Login error:', error);
    if (error.code === 'auth/popup-blocked') {
      return 'Popup was blocked by your browser. Please allow popups for localhost:3000 and try again.';
    }
    if (error.code === 'auth/unauthorized-domain') {
      const host = window.location.hostname;
      return `Sign-in is not authorized for "${host}". Ask your admin to add this domain in Firebase Console → Authentication → Settings → Authorized Domains.`;
    }
    if (error.code === 'auth/popup-closed-by-user') {
      return null; // user dismissed it — not a real error
    }
    return error.message || 'Sign-in failed. Please try again.';
  }
};

export const logout = () => signOut(auth);

export const subscribeToAuth = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
