import { getFirebaseDb } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  addDoc,
  deleteField,
  query,
  orderBy,
} from 'firebase/firestore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RoomParticipant {
  uid: string;
  displayName: string;
  photoURL: string;
  joinedAt: number;
}

export interface Room {
  roomId: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  status: 'active' | 'ended';
  participants: Record<string, RoomParticipant>;
  offer?: { sdp: string; type: string };
  answer?: { sdp: string; type: string };
}

export interface ChatMessage {
  id: string;
  text: string;
  senderUid: string;
  senderName: string;
  timestamp: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROOM_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

function generateRoomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 10; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ── Room CRUD ─────────────────────────────────────────────────────────────────

export async function createRoom(
  uid: string,
  displayName: string,
  photoURL?: string
): Promise<string> {
  const roomId = generateRoomId();
  const now = Date.now();
  await setDoc(doc(getFirebaseDb(), 'rooms', roomId), {
    roomId,
    createdBy: uid,
    createdAt: now,
    expiresAt: now + ROOM_EXPIRY_MS,
    status: 'active',
    participants: {
      [uid]: { uid, displayName, photoURL: photoURL || '', joinedAt: now },
    },
  });
  return roomId;
}

export async function getRoomById(roomId: string): Promise<Room | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'rooms', roomId));
  if (!snap.exists()) return null;
  const room = snap.data() as Room;
  if (room.status === 'ended') return null;
  if (room.expiresAt < Date.now()) return null;
  return room;
}

export async function joinRoom(
  roomId: string,
  uid: string,
  displayName: string,
  photoURL?: string
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'rooms', roomId), {
    [`participants.${uid}`]: { uid, displayName, photoURL: photoURL || '', joinedAt: Date.now() },
  });
}

export async function leaveRoom(roomId: string, uid: string, isLast: boolean): Promise<void> {
  if (isLast) {
    await updateDoc(doc(getFirebaseDb(), 'rooms', roomId), { status: 'ended' });
  } else {
    await updateDoc(doc(getFirebaseDb(), 'rooms', roomId), {
      [`participants.${uid}`]: deleteField(),
    });
  }
}

export function subscribeRoom(
  roomId: string,
  onUpdate: (room: Room | null) => void
): () => void {
  return onSnapshot(doc(getFirebaseDb(), 'rooms', roomId), (snap) => {
    onUpdate(snap.exists() ? (snap.data() as Room) : null);
  });
}

// ── WebRTC Signaling ──────────────────────────────────────────────────────────

export async function storeOffer(roomId: string, offer: RTCSessionDescriptionInit): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'rooms', roomId), {
    offer: { sdp: offer.sdp, type: offer.type },
  });
}

export async function storeAnswer(roomId: string, answer: RTCSessionDescriptionInit): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'rooms', roomId), {
    answer: { sdp: answer.sdp, type: answer.type },
  });
}

export async function addCallerCandidate(
  roomId: string,
  candidate: RTCIceCandidateInit
): Promise<void> {
  await addDoc(collection(getFirebaseDb(), 'rooms', roomId, 'callerCandidates'), candidate);
}

export async function addCalleeCandidate(
  roomId: string,
  candidate: RTCIceCandidateInit
): Promise<void> {
  await addDoc(collection(getFirebaseDb(), 'rooms', roomId, 'calleeCandidates'), candidate);
}

export function subscribeCallerCandidates(
  roomId: string,
  onCandidate: (c: RTCIceCandidateInit) => void
): () => void {
  return onSnapshot(
    collection(getFirebaseDb(), 'rooms', roomId, 'callerCandidates'),
    (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') onCandidate(change.doc.data() as RTCIceCandidateInit);
      });
    }
  );
}

export function subscribeCalleeCandidates(
  roomId: string,
  onCandidate: (c: RTCIceCandidateInit) => void
): () => void {
  return onSnapshot(
    collection(getFirebaseDb(), 'rooms', roomId, 'calleeCandidates'),
    (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') onCandidate(change.doc.data() as RTCIceCandidateInit);
      });
    }
  );
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export async function sendChatMessage(
  roomId: string,
  senderUid: string,
  senderName: string,
  text: string
): Promise<void> {
  await addDoc(collection(getFirebaseDb(), 'rooms', roomId, 'messages'), {
    text: text.trim(),
    senderUid,
    senderName,
    timestamp: Date.now(),
  });
}

export function subscribeMessages(
  roomId: string,
  onUpdate: (messages: ChatMessage[]) => void
): () => void {
  const q = query(
    collection(getFirebaseDb(), 'rooms', roomId, 'messages'),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
  });
}
