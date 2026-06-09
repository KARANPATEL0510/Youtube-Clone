import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UserUpload } from '@/lib/models/UserUpload';

/** POST /api/uploads/[id]/view — increment view count */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await UserUpload.findByIdAndUpdate(id, { $inc: { views: 1 } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error incrementing views:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
