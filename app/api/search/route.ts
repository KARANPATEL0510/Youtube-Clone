import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UserUpload } from '@/lib/models/UserUpload';

// ─── GET /api/search?q=<query>&limit=<n> ─────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const q = req.nextUrl.searchParams.get('q')?.trim();
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '40'), 100);

    if (!q) {
      return NextResponse.json({ uploads: [], total: 0 });
    }

    // Case-insensitive regex search on title and description
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const uploads = await UserUpload.find({
      visibility: 'public',
      $or: [{ title: regex }, { description: regex }, { category: regex }],
    })
      .sort({ views: -1, createdAt: -1 })
      .limit(limit)
      .populate('channelId', 'channelName profileImage')
      .lean();

    return NextResponse.json({
      uploads: uploads.map((upload) => ({
        id: upload._id.toString(),
        title: upload.title,
        description: upload.description,
        thumbnailUrl: upload.thumbnailUrl,
        videoUrl: upload.videoUrl,
        category: upload.category,
        views: upload.views,
        likes: upload.likes,
        createdAt: upload.createdAt,
        authorName: (upload.channelId as { channelName?: string; profileImage?: string })?.channelName || 'Unknown',
        authorPhotoUrl: (upload.channelId as { channelName?: string; profileImage?: string })?.profileImage,
      })),
      total: uploads.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
