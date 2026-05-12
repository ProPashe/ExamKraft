import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

console.log('Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log('Firestore initialized.');

const subjects = [
  // O-Level
  { name: 'Additional Maths', level: 'O-Level', syllabus: 'Cambridge', icon: '📐', color: '#3b82f6', description: 'Advanced mathematical concepts and calculus for high-performing students.' },
  { name: 'Pure Maths', level: 'O-Level', syllabus: 'Cambridge', icon: '📊', color: '#8b5cf6', description: 'Fundamental mathematical principles and logical reasoning.' },
  { name: 'General Maths', level: 'O-Level', syllabus: 'Cambridge', icon: '➕', color: '#10b981', description: 'Core mathematics for everyday applications and academic foundation.' },
  { name: 'Computer Science', level: 'O-Level', syllabus: 'Cambridge', icon: '💻', color: '#f59e0b', description: 'Introduction to algorithms, programming, and computer architecture.' },
  { name: 'Geography', level: 'O-Level', syllabus: 'Cambridge', icon: '🌍', color: '#ef4444', description: 'Physical and human geography, environmental studies, and map reading.' },
  
  // A-Level
  { name: 'Pure Maths', level: 'A-Level', syllabus: 'Cambridge', icon: '📊', color: '#8b5cf6', description: 'Advanced pure mathematics, complex numbers, and integration.' },
  { name: 'Computer Science', level: 'A-Level', syllabus: 'Cambridge', icon: '💻', color: '#f59e0b', description: 'System design, advanced data structures, and software engineering principles.' },
  { name: 'Application Development', level: 'A-Level', syllabus: 'Cambridge', icon: '📱', color: '#ec4899', description: 'Practical software creation, UI/UX design, and database integration.' },
  { name: 'Geography', level: 'A-Level', syllabus: 'Cambridge', icon: '🌍', color: '#ef4444', description: 'In-depth study of geomorphology, climate, and global population dynamics.' },
];

async function seed() {
  console.log('Starting seed process...');
  const subjectsRef = collection(db, 'subjects');

  try {
    for (const subject of subjects) {
      console.log(`Checking ${subject.name} (${subject.level})...`);
      const q = query(subjectsRef, where('name', '==', subject.name), where('level', '==', subject.level));
      const snap = await getDocs(q);

      if (snap.empty) {
        await addDoc(subjectsRef, {
          ...subject,
          createdAt: new Date(),
          topicsCount: 0
        });
        console.log(`✅ Added: ${subject.name} (${subject.level})`);
      } else {
        console.log(`⏭️ Skipped: ${subject.name} (${subject.level})`);
      }
    }
    console.log('🎉 Seed process completed successfully.');
  } catch (error) {
    console.error('❌ Seed process failed:', error);
  }
  process.exit(0);
}

seed().catch(console.error);
