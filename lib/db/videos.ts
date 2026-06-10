'use client';
import { getFirebaseDb } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
} from 'firebase/firestore';

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  views: number;
  likes: number;
  createdAt: number;
  updatedAt: number;
  category?: string;
}

export const uploadVideo = async (videoData: Omit<Video, 'id'>) => {
  try {
    const videoRef = doc(collection(getFirebaseDb(), 'videos'));
    const video: Video = {
      ...videoData,
      id: videoRef.id,
    };
    await setDoc(videoRef, video);
    return video;
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};

export const getVideo = async (videoId: string): Promise<Video | null> => {
  try {
    const videoRef = doc(getFirebaseDb(), 'videos', videoId);
    const videoSnap = await getDoc(videoRef);
    if (!videoSnap.exists()) return null;

    const data = videoSnap.data();
    return {
      ...data,
      id: videoSnap.id,
      createdAt: data.createdAt?.toMillis?.() || Date.now(),
      updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
    } as Video;
  } catch (error) {
    console.error('Error getting video:', error);
    throw error;
  }
};

export const getVideosByAuthor = async (authorId: string): Promise<Video[]> => {
  try {
    const q = query(
      collection(getFirebaseDb(), 'videos'),
      where('authorId', '==', authorId)
    );
    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
        updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
      } as Video;
    });
    return videos.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error getting videos by author:', error);
    throw error;
  }
};

export const getVideosByCategory = async (
  category: string
): Promise<Video[]> => {
  try {
    const allVideos = await getAllVideos();
    return allVideos.filter((video) => video.category === category);
  } catch (error) {
    console.error('Error getting videos by category:', error);
    throw error;
  }
};

export const getAllVideos = async (): Promise<Video[]> => {
  try {
    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
      limit(150),
    ];
    const q = query(collection(getFirebaseDb(), 'videos'), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
        updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
      } as Video;
    });
  } catch (error) {
    console.error('Error getting videos:', error);
    throw error;
  }
};
