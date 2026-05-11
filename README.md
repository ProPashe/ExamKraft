# ExamKraft 🎓

> **Gamified ZIMSEC & Cambridge Exam Preparation Platform**  
> Live tutoring · AI-powered assessments · Real-time whiteboards · XP-based progress

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎮 **Gamification** | XP, levels, streaks, badges and a live leaderboard |
| 📚 **Structured Curriculum** | ZIMSEC & Cambridge subjects, topics, video lessons, and downloadable resources |
| 🧠 **AI Assessments** | MCQ and short-answer exams with instant scoring |
| 🖥️ **Live Whiteboard** | Real-time collaborative whiteboard between tutors and students |
| 💬 **Chat System** | Direct messaging between students and tutors with file attachment support |
| 📋 **Assignment Hub** | Admin-set assignments, student submissions, and graded feedback |
| 💳 **Paynow Payments** | Secure EcoCash / mobile-money topic unlocking via Paynow (Zimbabwe) |
| 🏆 **Certificates** | Verifiable digital certificates issued on topic completion |
| 📢 **Announcements** | Admin broadcast system for platform-wide notices |

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Express.js + TypeScript (served via `tsx`)
- **Database**: Firebase Firestore (real-time)
- **Auth**: Firebase Authentication (Google Sign-In)
- **Storage**: Firebase Cloud Storage
- **Payments**: Paynow (EcoCash / mobile money)
- **AI**: Google Gemini API
- **Whiteboard**: tldraw v5

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project (Firestore + Auth + Storage enabled)
- A Paynow merchant account (for payments)
- A Gemini API key (for AI features)

### 1. Clone & Install

```bash
git clone https://github.com/yourorg/examkraft.git
cd examkraft
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in all required values:

| Variable | Where to get it |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase Console → Project Settings |
| `PAYNOW_INTEGRATION_ID` | Paynow Merchant Dashboard → Integration Keys |
| `PAYNOW_INTEGRATION_KEY` | Paynow Merchant Dashboard → Integration Keys |
| `ADMIN_EMAIL` | Your Google account email |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |

### 3. Firebase Setup

1. Enable **Firestore**, **Authentication** (Google provider), and **Storage** in the Firebase Console.
2. Update `firebase-applet-config.json` with your project's config (found in Project Settings → Your apps).
3. Deploy Firestore security rules:

```bash
npm install -g firebase-tools
firebase login
firebase use YOUR_PROJECT_ID
firebase deploy --only firestore:rules
```

4. Add your deployment domain to **Firebase Auth → Settings → Authorized Domains**.

### 4. Run in Development

```bash
npm run dev
```

This starts the Express server (which also proxies Vite HMR) at **http://localhost:3000**.

### 5. Build for Production

```bash
npm run build       # Build the frontend
npm start           # Start the production server
```

---

## 📁 Project Structure

```
examkraft/
├── src/
│   ├── pages/          # Route-level page components
│   │   ├── admin/      # Admin-only pages (MarkingCenter, LiveBoard)
│   │   └── ...
│   ├── components/     # Shared UI components
│   ├── services/       # API & Firebase service layer
│   ├── lib/            # Firebase init, utility functions
│   ├── App.tsx         # Router and navigation
│   └── AuthContext.tsx # Global auth state
├── server.ts           # Express backend + Vite dev middleware
├── firestore.rules     # Firestore security rules
├── firebase-applet-config.json  # Firebase client config
├── .env.example        # Environment variable template
└── vite.config.ts      # Vite build config
```

---

## 🔐 Security Notes

- All financial operations (payment initiation, webhook verification) happen **server-side**.
- Firestore rules enforce ownership — students can only read/write their own data.
- The admin role is guarded both by Firestore rules (checked against the `admins` collection) and the server (checks the Firebase ID token email).
- The Paynow webhook polls Paynow directly to verify status rather than trusting the incoming payload.
- Environment secrets (API keys, integration keys) are never exposed to the frontend.

---

## 🌍 Deployment

ExamKraft runs as a single Node.js process. You can deploy it to any platform that supports Node.js:

### Render / Railway / Fly.io

1. Connect your GitHub repository.
2. Set the environment variables from `.env.example`.
3. Set the **build command** to `npm run build`.
4. Set the **start command** to `npm start`.
5. Add your deployment URL to Firebase Auth authorized domains.
6. Set `FRONTEND_URL` to your production URL.

### Paynow Return URL

In your Paynow merchant dashboard, set the **Return URL** and **Result URL** to:
- Return: `https://yourdomain.com/payment-status`
- Result (webhook): `https://yourdomain.com/api/webhooks/paynow`

---

## 📄 License

MIT © ExamKraft
