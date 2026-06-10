# YouTube Clone - Channel & Upload Setup Guide

## 🎯 What's New

Your YouTube Clone now has channel creation and user-specific video uploads using MongoDB!

### New Features:
- ✅ Create your own channel
- ✅ Upload videos to your channel
- ✅ Channel dashboard with analytics
- ✅ Video visibility controls (Public, Unlisted, Private)
- ✅ View all your uploads in one place

## 🚀 Getting Started

### Step 1: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account (or log in)
3. Create a new cluster (M0 Free Tier is perfect)
4. Create a database named `youtube-clone`
5. Create a database user (username & password)
6. Get your connection string (it will look like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/youtube-clone
   ```

### Step 2: Update Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your MongoDB connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/youtube-clone
   ```

### Step 3: Restart Dev Server

```bash
npm run dev
```

The dev server will automatically restart and load the new MongoDB connection.

## 📍 New Routes

| Route | Purpose |
|-------|---------|
| `/create-channel` | Create your first channel |
| `/channel-dashboard` | View & manage your channel |
| `/upload` | Upload videos to your channel |
| `/api/channels` | Channel API endpoints |
| `/api/uploads` | Upload API endpoints |

## 🎬 How to Use

### Creating a Channel

1. Log in with Firebase Auth
2. Go to **Create Channel** from the sidebar
3. Enter your channel name and description
4. Click **Create Channel**

### Uploading Videos

1. Make sure you have a channel created
2. Click **Upload Video** or go to `/upload`
3. Fill in video details:
   - Title (required)
   - Description
   - Category
   - Video URL (direct link to MP4 or HLS stream)
   - Thumbnail URL
   - Visibility (Public/Unlisted/Private)
4. Click **Upload Video**

### Managing Your Channel

1. Go to **Channel Dashboard** in the sidebar
2. View your:
   - Channel info (name, subscriber count)
   - All uploaded videos
   - Basic analytics
   - Video visibility status

## 📊 Database Schema

### Channel Collection
```javascript
{
  userId: String,           // Firebase UID
  channelName: String,      // Your channel name
  description: String,      // Channel description
  profileImage: String,     // Channel avatar URL
  bannerImage: String,      // Channel banner URL
  subscriberCount: Number,  // Number of subscribers
  subscribers: [String],    // Array of subscriber user IDs
  createdAt: Date,
  updatedAt: Date
}
```

### UserUpload Collection
```javascript
{
  userId: String,           // Firebase UID
  channelId: ObjectId,      // Reference to Channel
  title: String,            // Video title
  description: String,      // Video description
  videoUrl: String,         // Direct video URL
  thumbnailUrl: String,     // Thumbnail image URL
  category: String,         // Video category
  duration: Number,         // Video duration in seconds
  views: Number,            // View count
  likes: Number,            // Like count
  comments: Number,         // Comment count
  visibility: String,       // 'public', 'private', 'unlisted'
  createdAt: Date,
  updatedAt: Date
}
```

## 🔗 API Endpoints

### Channels

**Create Channel:**
```bash
POST /api/channels
Content-Type: application/json

{
  "userId": "firebase_uid",
  "channelName": "My Channel",
  "description": "My awesome channel"
}
```

**Get Channel:**
```bash
GET /api/channels?userId=firebase_uid
```

### Uploads

**Upload Video:**
```bash
POST /api/uploads
Content-Type: application/json

{
  "userId": "firebase_uid",
  "title": "My First Video",
  "description": "Check out my video!",
  "videoUrl": "https://example.com/video.mp4",
  "thumbnailUrl": "https://example.com/thumb.jpg",
  "category": "Gaming",
  "visibility": "public"
}
```

**Get User's Uploads:**
```bash
GET /api/uploads?userId=firebase_uid
```

## 🛠️ Tech Stack

- **Database:** MongoDB (Atlas)
- **ORM:** Mongoose
- **Backend:** Next.js API Routes
- **Frontend:** React + TypeScript
- **Auth:** Firebase Authentication

## 📝 Notes

- Videos are stored in MongoDB with metadata
- Use externally hosted video URLs (AWS S3, Cloudinary, etc.)
- Thumbnails should be image URLs
- Private videos are only accessible to the owner
- All timestamps are in UTC

## 🐛 Troubleshooting

**"Channel not found"**
- Make sure you're logged in with Firebase
- Create a channel first before uploading

**MongoDB Connection Error**
- Check your MONGODB_URI in .env.local
- Make sure your IP is whitelisted in MongoDB Atlas
- Verify cluster is running

**Videos not appearing**
- Check video visibility settings
- Make sure uploaded to correct channel
- Refresh the page

## 🎓 Next Steps

1. ✅ Test channel creation
2. ✅ Test video uploads
3. 🔄 Add subscriber functionality
4. 🎵 Add video likes & comments
5. 🔍 Add search functionality
6. 📊 Add advanced analytics

---

**Questions?** Check the code comments in:
- `lib/mongodb.ts` - MongoDB connection
- `lib/models/` - Data models
- `app/api/` - API routes
