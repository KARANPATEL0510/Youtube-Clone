# Database Layer

This folder contains all Firebase database operations. The frontend components remain untouched and import database functions from here.

## Structure

- **users.ts** - User profile management
  - `createUserProfile()` - Create a new user profile
  - `getUserProfile()` - Fetch user data
  - `updateUserProfile()` - Update user information

- **videos.ts** - Video data management
  - `uploadVideo()` - Add a new video
  - `getVideo()` - Fetch a single video
  - `getVideosByAuthor()` - Get all videos from a creator
  - `getVideosByCategory()` - Get videos by category
  - `getAllVideos()` - Fetch all videos

- **interactions.ts** - User interactions (likes, watch later, history)
  - **Likes**: `likeVideo()`, `unlikeVideo()`
  - **Watch Later**: `addToWatchLater()`, `removeFromWatchLater()`, `getWatchLater()`
  - **History**: `addToHistory()`, `getHistory()`, `clearHistory()`

## Usage in Components

```typescript
import { getUserProfile, likeVideo, getWatchLater } from '@/lib/db';

// Get user profile
const user = await getUserProfile(userId);

// Like a video
await likeVideo(userId, videoId);

// Get watch later list
const watchLaterVideos = await getWatchLater(userId);
```

## Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Update `.env.local` with your Firebase credentials
3. Import and use database functions in your components

The frontend stays clean - all database logic is isolated here!
