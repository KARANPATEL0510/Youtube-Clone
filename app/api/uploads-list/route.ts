import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UserUpload } from '@/lib/models/UserUpload';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    // When userId is provided, get ALL user uploads (public, private, unlisted)
    // When no userId, get only public uploads
    let query = UserUpload.find(userId ? { userId } : { visibility: 'public' });

    const uploads = await query
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('channelId', 'channelName profileImage')
      .lean();

    const total = await UserUpload.countDocuments(
      userId ? { userId } : { visibility: 'public' }
    );

    console.log(`Fetched ${uploads.length} uploads`);

    return NextResponse.json(
      {
        uploads: uploads.map((upload) => ({
          id: upload._id,
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
          isPremiumContent: upload.isPremiumContent || false,
        })),
        total,
        limit,
        skip,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch uploads';
    console.error('Error fetching uploads:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
