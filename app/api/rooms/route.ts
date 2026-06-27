import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * GET /api/rooms?roomId=xxx  — Validate a room exists and is active
 * POST /api/rooms             — (room creation is handled client-side via lib/db/rooms.ts)
 */

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get('roomId');
  if (!roomId) {
    return NextResponse.json({ error: 'Missing roomId parameter' }, { status: 400 });
  }

  try {
    const snap = await getDoc(doc(getFirebaseDb(), 'rooms', roomId));
    if (!snap.exists()) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const room = snap.data();
    if (room.status === 'ended') {
      return NextResponse.json({ error: 'This meeting has ended' }, { status: 410 });
    }
    if (room.expiresAt < Date.now()) {
      return NextResponse.json({ error: 'This meeting has expired' }, { status: 410 });
    }

    return NextResponse.json({
      roomId: room.roomId,
      createdBy: room.createdBy,
      createdAt: room.createdAt,
      status: room.status,
      participantCount: Object.keys(room.participants || {}).length,
    });
  } catch (err) {
    console.error('[rooms] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 });
  }
}
