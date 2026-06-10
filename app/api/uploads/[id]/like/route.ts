import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UserUpload } from '@/lib/models/UserUpload';

/** POST /api/uploads/[id]/like   — increment likes */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await UserUpload.findByIdAndUpdate(id, { $inc: { likes: 1 } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error incrementing likes:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

/** DELETE /api/uploads/[id]/like  — decrement likes */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await UserUpload.findByIdAndUpdate(id, { $inc: { likes: -1 } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error decrementing likes:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
