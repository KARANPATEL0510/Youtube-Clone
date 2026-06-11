import { getFirebaseDb } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
} from 'firebase/firestore';

export interface OtpDocument {
  target: string;
  otp: string;
  expiresAt: number;
  verified: boolean;
  createdAt: number;
}

/**
 * Store the generated OTP in Firestore collection 'otps'.
 */
export async function storeOtpInDb(target: string, otp: string, expiryMs: number): Promise<void> {
  try {
    const db = getFirebaseDb();
    const otpsCollection = collection(db, 'otps');
    await addDoc(otpsCollection, {
      target,
      otp,
      expiresAt: Date.now() + expiryMs,
      verified: false,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error('Error storing OTP in database:', error);
    throw new Error('Database operation failed');
  }
}

/**
 * Retrieve and verify the OTP from Firestore collection 'otps'.
 * Uses in-memory sorting to avoid requiring composite indexes in Firestore.
 */
export async function verifyOtpInDb(target: string, otp: string): Promise<boolean> {
  try {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'otps'),
      where('target', '==', target),
      where('verified', '==', false)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;

    // Get all unverified documents and sort them by createdAt desc in-memory
    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ref: doc.ref,
      data: doc.data() as OtpDocument,
    }));

    docs.sort((a, b) => b.data.createdAt - a.data.createdAt);

    const latest = docs[0];
    const now = Date.now();

    // Check expiration
    if (latest.data.expiresAt < now) {
      return false;
    }

    // Check code match
    if (latest.data.otp !== otp) {
      return false;
    }

    // Mark as verified to prevent replay attacks
    await updateDoc(latest.ref, { verified: true });
    return true;
  } catch (error) {
    console.error('Error verifying OTP in database:', error);
    throw new Error('Database verification failed');
  }
}
