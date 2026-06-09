'use client';
import { getFirebaseDb } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  arrayRemove,
  updateDoc,
} from 'firebase/firestore';

export interface Like {
  videoId: string;
  userId: string;
  createdAt: number;
}

export interface WatchLater {
  videoId: string;
  userId: string;
  addedAt: number;
}

export interface HistoryItem {
  videoId: string;
  userId: string;
  watchedAt: number;
}

/**
 * Returns true if the videoId looks like a MongoDB ObjectId (24-char hex).
 */
function isMongoId(videoId: string): boolean {
  return /^[a-f0-9]{24}$/i.test(videoId);
}

// LIKES
export const likeVideo = async (userId: string, videoId: string) => {
  try {
    const db = getFirebaseDb();
    const likeRef = doc(db, 'likes', `${userId}_${videoId}`);
    await setDoc(likeRef, { videoId, userId, createdAt: Date.now() });

    if (isMongoId(videoId)) {
      await fetch(`/api/uploads/${videoId}/like`, { method: 'POST' }).catch(() => {});
    } else {
      const videoRef = doc(db, 'videos', videoId);
      const videoSnap = await getDoc(videoRef);
      if (videoSnap.exists()) {
        await updateDoc(videoRef, { likes: arrayUnion(userId) });
      }
    }
  } catch (error) {
    console.error('Error liking video:', error);
    throw error;
  }
};

export const unlikeVideo = async (userId: string, videoId: string) => {
  try {
    const db = getFirebaseDb();
    const likeRef = doc(db, 'likes', `${userId}_${videoId}`);
    await deleteDoc(likeRef);

    if (isMongoId(videoId)) {
      await fetch(`/api/uploads/${videoId}/like`, { method: 'DELETE' }).catch(() => {});
    } else {
      const videoRef = doc(db, 'videos', videoId);
      const videoSnap = await getDoc(videoRef);
      if (videoSnap.exists()) {
        await updateDoc(videoRef, { likes: arrayRemove(userId) });
      }
    }
  } catch (error) {
    console.error('Error unliking video:', error);
    throw error;
  }
};

export const getLikedVideos = async (userId: string): Promise<string[]> => {
  try {
    const q = query(collection(getFirebaseDb(), 'likes'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data().videoId);
  } catch (error) {
    console.error('Error getting liked videos:', error);
    throw error;
  }
};

// WATCH LATER
export const addToWatchLater = async (userId: string, videoId: string) => {
  try {
    const watchLaterRef = doc(getFirebaseDb(), 'watchLater', `${userId}_${videoId}`);
    await setDoc(watchLaterRef, { videoId, userId, addedAt: Date.now() });
  } catch (error) {
    console.error('Error adding to watch later:', error);
    throw error;
  }
};

export const removeFromWatchLater = async (userId: string, videoId: string) => {
  try {
    const watchLaterRef = doc(getFirebaseDb(), 'watchLater', `${userId}_${videoId}`);
    await deleteDoc(watchLaterRef);
  } catch (error) {
    console.error('Error removing from watch later:', error);
    throw error;
  }
};

export const getWatchLater = async (userId: string): Promise<string[]> => {
  try {
    const q = query(collection(getFirebaseDb(), 'watchLater'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data().videoId);
  } catch (error) {
    console.error('Error getting watch later:', error);
    throw error;
  }
};

// HISTORY
export const addToHistory = async (userId: string, videoId: string) => {
  try {
    const db = getFirebaseDb();
    const historyRef = doc(collection(db, 'history'));
    await setDoc(historyRef, { videoId, userId, watchedAt: Date.now() });

    if (isMongoId(videoId)) {
      await fetch(`/api/uploads/${videoId}/view`, { method: 'POST' }).catch(() => {});
    } else {
      const videoRef = doc(db, 'videos', videoId);
      const videoSnap = await getDoc(videoRef);
      if (videoSnap.exists()) {
        const currentViews = videoSnap.data().views || 0;
        await updateDoc(videoRef, { views: currentViews + 1 }).catch(() => {});
      }
    }
  } catch (error) {
    console.error('Error adding to history:', error);
    // Don't throw — history tracking should never crash the watch page
  }
};

export const getHistory = async (userId: string): Promise<string[]> => {
  try {
    const q = query(collection(getFirebaseDb(), 'history'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map((doc) => ({ videoId: doc.data().videoId, watchedAt: doc.data().watchedAt }))
      .sort((a, b) => b.watchedAt - a.watchedAt)
      .map((item) => item.videoId);
  } catch (error) {
    console.error('Error getting history:', error);
    throw error;
  }
};

export const clearHistory = async (userId: string) => {
  try {
    const q = query(collection(getFirebaseDb(), 'history'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    await Promise.all(querySnapshot.docs.map((doc) => deleteDoc(doc.ref)));
  } catch (error) {
    console.error('Error clearing history:', error);
    throw error;
  }
};
