import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UserUpload } from '@/lib/models/UserUpload';
import { Channel } from '@/lib/models/Channel';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const {
      userId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      category,
      visibility,
    } = await req.json();

    if (!userId || !title || !videoUrl || !thumbnailUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the channel for this user
    const channel = await Channel.findOne({ userId });
    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found. Please create a channel first.' },
        { status: 404 }
      );
    }

    const upload = new UserUpload({
      userId,
      channelId: channel._id,
      title,
      description: description || '',
      videoUrl,
      thumbnailUrl,
      category: category || 'General',
      visibility: visibility || 'public',
    });

    await upload.save();

    return NextResponse.json(upload, { status: 201 });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');

    if (!userId && !id) {
      return NextResponse.json(
        { error: 'userId or id parameter required' },
        { status: 400 }
      );
    }

    // Fetch by upload ID
    if (id) {
      const upload = await UserUpload.findById(id)
        .populate('channelId', 'channelName profileImage')
        .lean();

      if (!upload) {
        return NextResponse.json(
          { error: 'Upload not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        upload: {
          _id: upload._id,
          userId: upload.userId,
          title: upload.title,
          description: upload.description,
          thumbnailUrl: upload.thumbnailUrl,
          videoUrl: upload.videoUrl,
          category: upload.category,
          views: upload.views,
          likes: upload.likes,
          createdAt: upload.createdAt,
          updatedAt: upload.updatedAt,
          channelName: (upload.channelId as { channelName?: string; profileImage?: string })?.channelName || 'Unknown',
          profileImage: (upload.channelId as { channelName?: string; profileImage?: string })?.profileImage,
          isPremiumContent: upload.isPremiumContent || false,
        },
      });
    }

    // Fetch by userId
    const uploads = await UserUpload.find({ userId })
      .sort({ createdAt: -1 })
      .populate('channelId');

    return NextResponse.json(uploads);
  } catch (error) {
    console.error('Error fetching uploads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch uploads' },
      { status: 500 }
    );
  }
}
