'use client';
import { getFirebaseDb } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: number;
}

export const createUserProfile = async (
  uid: string,
  email: string,
  displayName: string,
  photoURL?: string
) => {
  try {
    const userRef = doc(getFirebaseDb(), 'users', uid);
    await setDoc(userRef, {
      uid,
      email,
      displayName,
      photoURL: photoURL || '',
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userRef = doc(getFirebaseDb(), 'users', uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? (userSnap.data() as User) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (
  uid: string,
  updates: Partial<User>
) => {
  try {
    const userRef = doc(getFirebaseDb(), 'users', uid);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};
