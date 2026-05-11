import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Subjects and Topics
export const getSubjects = async () => {
  const querySnapshot = await getDocs(collection(db, 'subjects'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getTopics = async (subjectId: string) => {
  const querySnapshot = await getDocs(
    query(collection(db, 'subjects', subjectId, 'topics'), orderBy('order', 'asc'))
  );
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// User Progress
export const getUserTopics = async (userId: string) => {
  const q = query(collection(db, 'userTopics'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const unlockTopic = async (userId: string, topicId: string, subjectId: string) => {
  return addDoc(collection(db, 'userTopics'), {
    userId,
    topicId,
    subjectId,
    status: 'unlocked',
    unlockedAt: serverTimestamp(),
    passed: false,
    bestScore: 0
  });
};

export const completeTopic = async (userId: string, topicId: string, score: number) => {
  const q = query(
    collection(db, 'userTopics'), 
    where('userId', '==', userId), 
    where('topicId', '==', topicId)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const userTopicRef = doc(db, 'userTopics', querySnapshot.docs[0].id);
    await updateDoc(userTopicRef, {
      status: 'completed',
      passed: score >= 60, // passing threshold
      bestScore: score,
      completedAt: serverTimestamp()
    });
  }
};
