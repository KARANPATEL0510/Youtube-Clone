import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Download } from '@/lib/models/Download';
import { PremiumUser } from '@/lib/models/PremiumUser';

const FREE_DAILY_LIMIT = 1;

// GET /api/downloads?userId=xxx — list user's downloads
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  await connectDB();
  const downloads = await Download.find({ userId }).sort({ downloadedAt: -1 }).lean();
  return NextResponse.json({ downloads });
}

// POST /api/downloads — track a new download (checks limits)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, videoId, videoTitle, videoUrl, thumbnailUrl, channelName } = body;

    if (!userId || !videoId) {
      return NextResponse.json({ error: 'userId and videoId required' }, { status: 400 });
    }

    await connectDB();

    // Check premium status
    const premiumRecord = await PremiumUser.findOne({ userId });
    const isPremium = premiumRecord?.isPremium === true;

    if (!isPremium) {
      // Count today's downloads
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayCount = await Download.countDocuments({
        userId,
        downloadedAt: { $gte: startOfDay },
      });

      if (todayCount >= FREE_DAILY_LIMIT) {
        return NextResponse.json(
          { error: 'daily_limit_reached', limit: FREE_DAILY_LIMIT },
          { status: 429 }
        );
      }
    }

    // Record download
    await Download.create({
      userId,
      videoId,
      videoTitle: videoTitle || 'Untitled',
      videoUrl: videoUrl || '',
      thumbnailUrl: thumbnailUrl || '',
      channelName: channelName || '',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
