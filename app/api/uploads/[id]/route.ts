import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UserUpload } from '@/lib/models/UserUpload';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id: uploadId } = await params;

    if (!uploadId) {
      return NextResponse.json(
        { error: 'Upload ID is required' },
        { status: 400 }
      );
    }

    // Find the upload
    const upload = await UserUpload.findById(uploadId);

    if (!upload) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    // Extract file IDs from URLs (format: /api/files/{fileId})
    const videoFileId = upload.videoUrl?.split('/').pop();
    const thumbnailFileId = upload.thumbnailUrl?.split('/').pop();

    // Delete files from GridFS
    if (videoFileId) {
      try {
        const videoBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db!, {
          bucketName: 'videos',
        });
        await videoBucket.delete(new ObjectId(videoFileId));
        console.log(`Deleted video file: ${videoFileId}`);
      } catch (err) {
        console.error(`Error deleting video file: ${err}`);
      }
    }

    if (thumbnailFileId) {
      try {
        const thumbnailBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db!, {
          bucketName: 'thumbnails',
        });
        await thumbnailBucket.delete(new ObjectId(thumbnailFileId));
        console.log(`Deleted thumbnail file: ${thumbnailFileId}`);
      } catch (err) {
        console.error(`Error deleting thumbnail file: ${err}`);
      }
    }

    // Delete the upload record from MongoDB
    await UserUpload.findByIdAndDelete(uploadId);

    return NextResponse.json({
      message: 'Upload deleted successfully',
      deletedId: uploadId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete upload';
    console.error('Error deleting upload:', errorMessage, error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
