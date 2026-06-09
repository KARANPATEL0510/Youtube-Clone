import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard: skip initialization at build time when env vars are missing
const hasConfig = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

if (hasConfig) {
  try {
    _app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    _auth = getAuth(_app);
    _db = getFirestore(_app);
    _storage = getStorage(_app);
  } catch (e) {
    console.warn('[Firebase] Initialization failed:', e);
  }
}

// Non-null getters — used by DB helper files (client-only, always called after init)
export const getFirebaseAuth = (): Auth => _auth!;
export const getFirebaseDb = (): Firestore => _db!;
export const getFirebaseStorage = (): FirebaseStorage => _storage!;

// Nullable exports — used directly where null checks are needed (e.g. auth-context)
export const auth = _auth;
export const db = _db;
export const storage = _storage;
export default _app;
