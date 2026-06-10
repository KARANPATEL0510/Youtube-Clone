import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { PremiumUser } from '@/lib/models/PremiumUser';

// GET /api/premium/status?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ isPremium: false });

  await connectDB();
  const record = await PremiumUser.findOne({ userId }).lean();
  return NextResponse.json({ isPremium: record?.isPremium === true });
}
