import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Channel } from '@/lib/models/Channel';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { userId, channelName, description } = await req.json();

    if (!userId || !channelName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if channel already exists for this user
    const existingChannel = await Channel.findOne({ userId });
    if (existingChannel) {
      return NextResponse.json(
        { error: 'Channel already exists for this user' },
        { status: 400 }
      );
    }

    const channel = new Channel({
      userId,
      channelName,
      description: description || '',
    });

    const savedChannel = await channel.save();
    console.log('Channel created successfully:', { userId, channelId: savedChannel._id });

    return NextResponse.json(savedChannel, { status: 201 });
  } catch (error: any) {
    console.error('Error creating channel:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Failed to create channel', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      );
    }

    console.log('Fetching channel for userId:', userId);
    const channel = await Channel.findOne({ userId });

    if (!channel) {
      console.log('Channel not found for userId:', userId);
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    console.log('Channel found:', { userId, channelId: channel._id });
    return NextResponse.json(channel);
  } catch (error: any) {
    console.error('Error fetching channel:', error.message || error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch channel', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
