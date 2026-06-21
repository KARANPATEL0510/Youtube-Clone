import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { PremiumUser } from '@/lib/models/PremiumUser';

// GET /api/premium/status?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({
      isPremium: false,
      plan: 'free',
      videoTimeLimit: 300,
    });
  }

  await connectDB();
  const record = await PremiumUser.findOne({ userId }).lean();

  if (!record) {
    return NextResponse.json({
      isPremium: false,
      plan: 'free',
      videoTimeLimit: 300,
    });
  }

  // Calculate limit in seconds
  let limit = 300; // Free = 5 min
  if (record.plan === 'bronze') limit = 420; // 7 min
  else if (record.plan === 'silver') limit = 600; // 10 min
  else if (record.plan === 'gold' || record.isPremium) limit = -1; // Unlimited

  return NextResponse.json({
    isPremium: record.isPremium === true || record.plan === 'gold' || record.plan === 'silver' || record.plan === 'bronze',
    plan: record.plan || (record.isPremium ? 'gold' : 'free'),
    videoTimeLimit: limit,
  });
}
