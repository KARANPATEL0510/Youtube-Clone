'use client';
import { auth } from '@/lib/firebase';
import {
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  Auth,
} from 'firebase/auth';
import { useEffect, useState } from 'react';

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(
      auth as Auth,
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { user, loading, error };
}

export async function loginUser(email: string, password: string) {
  if (!auth) throw new Error('Firebase not initialized');
  try {
    const result = await signInWithEmailAndPassword(auth as Auth, email, password);
    return result.user;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Login failed');
  }
}

export async function registerUser(email: string, password: string) {
  if (!auth) throw new Error('Firebase not initialized');
  try {
    const result = await createUserWithEmailAndPassword(auth as Auth, email, password);
    return result.user;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Registration failed');
  }
}

export async function logoutUser() {
  if (!auth) throw new Error('Firebase not initialized');
  try {
    await signOut(auth as Auth);
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Logout failed');
  }
}
