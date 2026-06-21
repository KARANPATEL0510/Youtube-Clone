<div align="center">

# 🎬 YouTube Clone

**A full-stack YouTube clone built with Next.js 16, Firebase, MongoDB, and Razorpay Payments**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-GridFS%20%26%20Atlas-green?style=for-the-badge&logo=mongodb)](https://mongodb.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)

[Live Demo](#) · [Report Bug](https://github.com/KARANPATEL0510/Youtube-Clone/issues) · [Request Feature](https://github.com/KARANPATEL0510/Youtube-Clone/issues)

</div>

---

## 📸 Overview

A feature-rich YouTube clone that lets users **upload, watch, search, like, comment, translate, and moderate** videos. Built with a modern dual-database architecture — **Firebase** for authentication & user data, **MongoDB GridFS** for video file storage, and **Razorpay** for subscription upgrades.

---

## ✨ Features

### 🎥 Video & Playback
- Upload videos (MP4, WebM, OGG) with custom thumbnails.
- Video player with native browser controls.
- View count tracking (session-deduped — no fake inflation on refresh).
- Related videos sidebar by category.

### 👆 Watch Gestures (Custom Player Shortcuts)
- **Double Tap Left/Right**: Fast-rewind or fast-forward video by 10 seconds.
- **Triple Tap Left**: Smoothly scroll down to the comment section.
- **Triple Tap Center**: Play the next related video in the sidebar.
- **Triple Tap Right**: Triggers a website exit confirmation modal.

### 👑 Tiered Premium Subscriptions & Playback Limits
Implement visual paywalls that automatically pause playback and show a locked upgrade screen:
- **Free Plan**: Restricted to 5 minutes (300s) of video playback. No downloads allowed.
- **Bronze Plan (₹10)**: Playback extended to 7 minutes (420s), ad-free, 1 download/day limit.
- **Silver Plan (₹50)**: Playback extended to 10 minutes (600s), ad-free, 5 downloads/day limit.
- **Gold Plan (₹100)**: Unlimited playback duration, ad-free, and unlimited downloads.
- **Billing Invoices**: Success checkouts instantly dispatch a professionally formatted HTML invoice to the user's email address.

### 💳 Payments Integration & Mock Sandbox Checkout
- Securely processes pricing payments using the **Razorpay Payment Gateway**.
- Automates signature verification and database status upgrades upon checkout.
- **Mock Checkout Mode**: Runs checkout simulation seamlessly if `RAZORPAY_KEY_ID` is not configured, allowing sandbox validations without real credentials.

### 🔒 Secure Email OTP Login
- Enhanced security replacing SMS/phone gates.
- Automatically generates and sends a random 6-digit OTP verification code to the logging user's email via SMTP / Gmail App Passwords.
- Features developmental fallback log warnings to ensure sandbox tests remain unblocked.

### 💬 Comments (Enhanced)
- Post, reply to, and delete comments (MongoDB-backed).
- Nested replies with expand/collapse.
- Sorted by **Newest** or **Top** comments.
- 🌍 **Comment Translation** — translate any comment into 10+ languages (Hindi, French, Spanish, Arabic, Chinese, and more) using MyMemory free API.
- 📍 **User City Display** — shows commenter's city for geographic context (auto-detected via IP geolocation).
- 👍👎 **Like & Dislike system** on comments with per-user tracking.
- 🛡️ **Auto-Moderation** — comments are automatically deleted when they reach **2 or more dislikes**.
- ✍️ **Input Validation** — special characters and abusive patterns are blocked before submission.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Auth** | Firebase Authentication |
| **Database** | Firestore (user data) + MongoDB Atlas (video & comment metadata) |
| **File Storage** | MongoDB GridFS (video & thumbnail files) |
| **Payments** | Razorpay Node SDK & Checkout JS |
| **Invoicing & OTP** | Nodemailer (SMTP/Gmail App Password integration) |
| **Translation** | MyMemory Free Translation API (no API key required) |
| **Geolocation** | IP-based city detection (ipapi.co) |
| **Icons** | Lucide React |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://firebase.google.com) project (Auth + Firestore)
- A [MongoDB Atlas](https://mongodb.com/atlas) cluster
- A Gmail account with an App Password (for SMTP emails)

### 1. Clone the repo

```bash
git clone https://github.com/KARANPATEL0510/Youtube-Clone.git
cd Youtube-Clone
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your own keys:

```bash
cp .env.local.example .env.local
```

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# MongoDB
MONGODB_URI=

# Razorpay (Leave empty to trigger Mock Checkout Mode)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# SMTP Invoices & OTP Delivery
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM="YouTube Clone" <your-email@gmail.com>
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
youtube-clone/
├── app/
│   ├── api/                  # REST API routes
│   │   ├── comments/         # GET · POST · DELETE · PATCH
│   │   ├── translate/        # POST — translate comment text
│   │   ├── search/           # Full-text video search
│   │   ├── uploads/          # Video upload & metadata
│   │   ├── files/            # GridFS file streaming
│   │   ├── send-otp/         # POST — Generate and email login verification code
│   │   └── premium/          # Premium management APIs (status, create-order, verify)
│   ├── watch/[id]/           # Video watch page with gesture overlays & time-limit blockers
│   ├── subscription/         # User subscription dashboard (plan upgrades, active status)
│   ├── channel/[id]/         # Public channel page
│   ├── history/              # Watch history
│   ├── liked/                # Liked videos
│   ├── watch-later/          # Watch later list
│   └── upload/               # Video upload page
├── components/
│   ├── comments.tsx          # Full comments section (with translation, moderation)
│   ├── header.tsx            # Top nav with search
│   ├── video-card.tsx        # Thumbnail card
│   └── premium-modal.tsx     # Dynamic Razorpay subscription checkouts cards
└── lib/
    ├── db/                   # Firebase Firestore helpers
    ├── models/               # Mongoose models (Comment, Channel, Upload, PremiumUser)
    ├── contexts/             # Auth & Category React contexts
    └── mongodb.ts            # MongoDB connection
```

---

## 🔌 API Routes

### Core API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/uploads-list` | List all public videos |
| `GET` | `/api/uploads?id=` | Get single video metadata |
| `POST` | `/api/upload` | Upload a new video |
| `DELETE` | `/api/uploads/:id` | Delete own video |
| `POST` | `/api/uploads/:id/like` | Like a video |
| `DELETE` | `/api/uploads/:id/like` | Unlike a video |
| `GET` | `/api/comments?videoId=` | Get comments (nested) |
| `POST` | `/api/comments` | Post a comment or reply |
| `DELETE` | `/api/comments?id=` | Delete own comment |
| `PATCH` | `/api/comments` | Like or dislike a comment |
| `GET` | `/api/search?q=` | Search videos by query |
| `GET` | `/api/files/:id` | Stream a video/thumbnail file |
| `POST` | `/api/translate` | Translate comment text to target language |

### Auth & Subscriptions API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/send-otp` | Generate OTP and dispatch it to user email |
| `GET` | `/api/premium/status?userId=` | Returns user's plan and remaining playback duration |
| `POST` | `/api/premium/create-order` | Calculate cost and trigger Razorpay checkout order |
| `POST` | `/api/premium/verify` | Verify checkout signatures, activate tier, and email invoice |

---

## 🛡️ Comment Moderation Rules

| Rule | Detail |
|------|--------|
| **Special characters blocked** | Input validation rejects `< > { } [ ] \ /` and similar patterns |
| **Auto-delete on dislikes** | Comments with **≥ 2 dislikes** are automatically removed |
| **Per-user dislike tracking** | Each user can only dislike a comment once |
| **Max length** | Comments capped at 2,000 characters |

---

## 🌍 Translation Support

Comments can be translated on the fly to:

`Hindi` · `French` · `Spanish` · `Arabic` · `Chinese` · `German` · `Japanese` · `Portuguese` · `Russian` · `Korean`

Powered by the **MyMemory API** — free, no API key required.

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/KARANPATEL0510">Karan Patel</a>
</div>