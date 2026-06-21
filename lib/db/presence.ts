import { getFirebaseDb } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const setOnlineStatus = async (uid: string) => {
  try {
    const userRef = doc(getFirebaseDb(), 'users', uid);
    await updateDoc(userRef, {
      status: 'online',
      lastActive: Date.now(),
    });
  } catch (error) {
    console.error('Error setting online status:', error);
  }
};

export const setOfflineStatus = async (uid: string) => {
  try {
    const userRef = doc(getFirebaseDb(), 'users', uid);
    await updateDoc(userRef, {
      status: 'offline',
      lastActive: Date.now(),
    });
  } catch (error) {
    console.error('Error setting offline status:', error);
  }
};

export const updatePresenceHeartbeat = async (uid: string) => {
  try {
    const userRef = doc(getFirebaseDb(), 'users', uid);
    await updateDoc(userRef, {
      lastActive: Date.now(),
    });
  } catch (error) {
    console.error('Error updating presence heartbeat:', error);
  }
};
