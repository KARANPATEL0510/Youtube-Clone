<div align="center">

# 🎬 YouTube Clone

**A full-stack YouTube clone built with Next.js 16, Firebase, and MongoDB**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-GridFS%20%26%20Atlas-green?style=for-the-badge&logo=mongodb)](https://mongodb.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)

[Live Demo](#) · [Report Bug](https://github.com/KARANPATEL0510/Youtube-Clone/issues) · [Request Feature](https://github.com/KARANPATEL0510/Youtube-Clone/issues)

</div>

---

## 📸 Overview

A feature-rich YouTube clone that lets users **upload, watch, search, like, comment, translate, and moderate** videos. Built with a modern dual-database architecture — **Firebase** for authentication & user data, **MongoDB GridFS** for video file storage.

---

## ✨ Features

### 🎥 Video
- Upload videos (MP4, WebM, OGG) with custom thumbnails
- Video player with native browser controls
- View count tracking (session-deduped — no fake inflation on refresh)
- Related videos sidebar by category

### 🔍 Search
- Real-time search across both Firestore and MongoDB video sources
- Searches by title, description, and category
- YouTube-style list view with thumbnails, channel info, and metadata

### 💬 Comments (Enhanced)
- Post, reply to, and delete comments (MongoDB-backed)
- Nested replies with expand/collapse
- Sorted by **Newest** or **Top** comments
- Auth-aware — shows your own avatar and name
- 🌍 **Comment Translation** — translate any comment into 10+ languages (Hindi, French, Spanish, Arabic, Chinese, and more) using the MyMemory free API
- 📍 **User City Display** — shows the commenter's city for geographic context (auto-detected via IP geolocation)
- 👍👎 **Like & Dislike system** on comments with per-user tracking
- 🛡️ **Auto-Moderation** — comments are automatically deleted when they reach **2 or more dislikes**
- ✍️ **Input Validation** — special characters and abusive patterns are blocked before submission

### ❤️ Interactions
- Like / Unlike videos
- Watch Later list
- Watch History (deduplicated)
- Liked Videos page

### 👤 User & Channel
- Firebase Authentication (Email / Password)
- Create and manage your channel
- Channel page with subscriber count and video grid
- Channel Dashboard with analytics

### 📱 UI / UX
- Responsive layout (mobile → desktop)
- Dark mode support throughout
- Loading skeletons everywhere (no layout shift)
- Share button — copies URL to clipboard with ✓ toast

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
| **Translation** | MyMemory Free Translation API (no API key required) |
| **Geolocation** | IP-based city detection (ipapi.co) |
| **Icons** | Lucide React |
| **Fonts** | Inter (Google Fonts) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://firebase.google.com) project (Auth + Firestore)
- A [MongoDB Atlas](https://mongodb.com/atlas) cluster

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
│   │   ├── comments/         # GET · POST · DELETE · PATCH (like/dislike)
│   │   ├── translate/        # POST — translate comment text via MyMemory
│   │   ├── search/           # Full-text video search
│   │   ├── uploads/          # Video upload & metadata
│   │   └── files/            # GridFS file streaming
│   ├── watch/[id]/           # Video watch page
│   ├── search/               # Search results page
│   ├── channel/[id]/         # Public channel page
│   ├── history/              # Watch history
│   ├── liked/                # Liked videos
│   ├── watch-later/          # Watch later list
│   └── upload/               # Video upload page
├── components/
│   ├── comments.tsx          # Full comments section (with translation, moderation)
│   ├── header.tsx            # Top nav with search
│   ├── video-card.tsx        # Thumbnail card
│   └── ...
└── lib/
    ├── db/                   # Firebase Firestore helpers
    ├── models/               # Mongoose models (Comment, Channel, Upload)
    ├── contexts/             # Auth & Category React contexts
    └── mongodb.ts            # MongoDB connection
```

---

## 🔌 API Routes

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