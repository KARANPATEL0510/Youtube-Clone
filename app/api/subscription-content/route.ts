import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UserUpload } from '@/lib/models/UserUpload';

// GET /api/subscription-content — returns premium-only videos
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    const videos = await UserUpload.find({ isPremiumContent: true, visibility: 'public' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const formatted = videos.map((v) => ({
      id: v._id?.toString(),
      title: v.title,
      description: v.description,
      thumbnailUrl: v.thumbnailUrl,
      videoUrl: v.videoUrl,
      category: v.category,
      views: v.views,
      likes: v.likes,
      createdAt: v.createdAt,
      isPremiumContent: true,
    }));

    return NextResponse.json({ videos: formatted });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
