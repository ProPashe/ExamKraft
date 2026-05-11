import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from 'firebase-admin';
import { Paynow } from 'paynow';
import dotenv from 'dotenv';

dotenv.config();

const APP_VERSION = '1.0.0';
const PORT = parseInt(process.env.PORT || '3000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || `http://localhost:${PORT}`;

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
}

const db = admin.firestore();

// Initialize Paynow
const paynow = new Paynow(
  process.env.PAYNOW_INTEGRATION_ID || "1234",
  process.env.PAYNOW_INTEGRATION_KEY || "key-secret"
);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS Middleware
const setCorsHeaders = (req: any, res: any, next: any) => {
  const allowedOrigins = [
    FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'https://examkraft.app',
  ];
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
};

// Auth Middleware
const authenticateUser = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying ID token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

async function startServer() {
  const app = express();

  app.use(setCorsHeaders);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "ExamKraft Server Running",
      version: APP_VERSION,
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  });

  // Initiate Paynow Payment (Protected)
  app.post("/api/initiate-payment", authenticateUser, async (req: any, res) => {
    const { amount, email, userId, topicId, subjectId, topicTitle } = req.body;
    
    // Ensure the user is only initiating for themselves
    if (req.user.uid !== userId) {
        return res.status(403).json({ success: false, message: "Forbidden: UID mismatch" });
    }
    
    try {
        const reference = `EK-${userId.substring(0, 5)}-${topicId.substring(0, 5)}-${Date.now()}`;
        const payment = paynow.createPayment(reference, email);
        
        payment.add(topicTitle, amount);
        
        // Results are sent here by Paynow
        const result = await paynow.send(payment);
        
        if (result.success) {
            // Save transaction in database with "pending" status
            await db.collection('transactions').doc(reference).set({
                userId,
                topicId,
                subjectId,
                amount,
                email,
                status: 'pending',
                pollUrl: result.pollUrl,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            res.json({ 
                success: true, 
                redirectUrl: result.redirectUrl 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: "Paynow initiation failed." 
            });
        }
    } catch (error: any) {
        console.error("Payment initiation error", error);
        res.status(500).json({ success: false, message: error.message });
    }
  });

  // Paynow Webhook
  app.post("/api/webhooks/paynow", async (req, res) => {
    const status = req.body;
    const reference = status.reference;
    
    try {
        // Poll Paynow for actual status to prevent spoofing
        const transactionRef = db.collection('transactions').doc(reference);
        const transDoc = await transactionRef.get();
        
        if (!transDoc.exists) {
            return res.status(404).send("Transaction not found");
        }

        const transData = transDoc.data()!;
        const pollResult = await paynow.pollTransaction(transData.pollUrl);

        if (pollResult.status === 'Paid') {
            // Update transaction
            await transactionRef.update({ status: 'completed', paidAt: admin.firestore.FieldValue.serverTimestamp() });

            // Unlock topic
            const userTopicRef = db.collection('userTopics').doc(`${transData.userId}_${transData.topicId}`);
            await userTopicRef.set({
                userId: transData.userId,
                topicId: transData.topicId,
                subjectId: transData.subjectId,
                status: 'unlocked',
                paymentRef: reference,
                unlockedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Update user enrolled subjects
            await db.collection('users').doc(transData.userId).update({
                enrolledSubjects: admin.firestore.FieldValue.arrayUnion(transData.subjectId)
            });
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("Webhook processing failed", error);
        res.sendStatus(500);
    }
  });

  // Keep compatibility for direct verification if needed (Protected)
  app.post("/api/verify-payment", authenticateUser, async (req: any, res) => {
    const { reference, topicId, userId, subjectId } = req.body;

    // Ensure the user is only verifying for themselves
    if (req.user.uid !== userId) {
        return res.status(403).json({ success: false, message: "Forbidden: UID mismatch" });
    }
    try {
        const userTopicRef = db.collection('userTopics').doc(`${userId}_${topicId}`);
        await userTopicRef.set({
            userId,
            topicId,
            subjectId,
            status: 'unlocked',
            paymentRef: reference,
            unlockedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        res.json({ success: true, message: "Manual unlock successful." });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
  });

  // Admin Elevation Secure Endpoint (Protected)
  app.post("/api/admin/elevate", authenticateUser, async (req: any, res) => {
    const { userId, email } = req.body;
    const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL;

    // Only the owner can elevate themselves or others, and they must match the admin email
    if (req.user.email !== ADMIN_EMAIL || email !== ADMIN_EMAIL) {
        return res.status(403).json({ success: false, message: "Unauthorized identification for elevation." });
    }

    try {
        await db.collection('users').doc(userId).update({
            role: 'admin'
        });
        
        // Also ensure they are in the admins collection for the rules helper
        await db.collection('admins').doc(userId).set({
            email,
            active: true,
            elevatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ success: true, message: "Master status confirmed and synchronized." });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
  });

  // Automated Welcome Chat (Simulated Cloud Function)
  try {
    db.collection('users').onSnapshot(async (snapshot) => {
      const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || 'mudzimwapanashe123@gmail.com';
      const adminSnap = await db.collection('users').where('email', '==', ADMIN_EMAIL).limit(1).get();
      if (adminSnap.empty) return;
      const adminId = adminSnap.docs[0].id;

      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const newUser = change.doc.data();
          const userId = change.doc.id;

          if (newUser.email === ADMIN_EMAIL) continue;

          // Check if chat already exists
          const participants = [adminId, userId].sort();
          const chatQuery = await db.collection('chats').where('participants', '==', participants).get();

          if (chatQuery.empty) {
            console.log(`[CHAT] Initializing welcome chat for student: ${userId}`);
            const chatRef = await db.collection('chats').add({
              participants,
              lastMessage: "Welcome to ExamKraft! I'm your tutor. Reach out here if you have any questions.",
              lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });

            await chatRef.collection('messages').add({
              senderUid: adminId,
              text: "Welcome to ExamKraft! I'm your tutor. Reach out here if you have any questions.",
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      }
    }, (error) => {
      console.error("[CHAT] Users snapshot listener failed:", error);
    });
  } catch (e) {
    console.error("[CHAT] Failed to setup users witness:", e);
  }

  // Global Notification Listener (Simulated Cloud Function)
  try {
    db.collection('notifications').where('status', '==', 'pending').onSnapshot((snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const notif = change.doc.data();
          const notifId = change.doc.id;
          
          console.log(`[NOTIF] Processing: ${notif.title}`);
          
          db.collection('notifications').doc(notifId).update({
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp()
          }).catch(err => console.error(`[NOTIF] Update failed for ${notifId}:`, err));
        }
      }
    }, (error) => {
      console.error("[NOTIF] Snapshot listener failed:", error);
    });
  } catch (e) {
    console.error("[NOTIF] Failed to setup notification listener:", e);
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 ExamKraft v${APP_VERSION} running at http://localhost:${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Firebase Project: ${process.env.FIREBASE_PROJECT_ID || 'not set'}\n`);
  });
}

startServer();
