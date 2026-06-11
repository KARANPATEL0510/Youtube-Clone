// Deprecated: Email OTP is no longer used. Authentication is purely phone-based.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Deprecated endpoint' }, { status: 410 });
}
