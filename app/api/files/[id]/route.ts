import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id: fileId } = await params;

    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 });
    }

    // Validate ObjectId format before querying
    if (!ObjectId.isValid(fileId)) {
      return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 });
    }

    let file = null;
    let bucket: mongoose.mongo.GridFSBucket | null = null;

    for (const bucketName of ['videos', 'thumbnails']) {
      const b = new mongoose.mongo.GridFSBucket(mongoose.connection.db!, { bucketName });
      try {
        const files = await b.find({ _id: new ObjectId(fileId) }).toArray();
        if (files.length > 0) {
          file = files[0];
          bucket = b;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!file || !bucket) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const mimeType = file.metadata?.mimeType || 'video/mp4';
    const fileSize = file.length;
    const range = req.headers.get('range');

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Cache-Control': 'public, max-age=3600',
      'Accept-Ranges': 'bytes',
    };

    // ── Range request (browser seeking / partial content) ──────────────────────
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      // Default chunk size: 1 MB — keeps memory low and lets browser buffer smoothly
      const CHUNK = 1 * 1024 * 1024;
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK, fileSize - 1);

      if (isNaN(start) || start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}`, ...corsHeaders },
        });
      }

      const chunkSize = end - start + 1;

      // GridFS supports native start/end — no need to read from offset 0
      const downloadStream = bucket.openDownloadStream(new ObjectId(fileId), {
        start,
        end: end + 1, // GridFS end is exclusive
      });

      // Convert Node.js Readable → Web ReadableStream (true streaming, no buffering)
      const webStream = new ReadableStream({
        start(controller) {
          downloadStream.on('data', (chunk: Buffer) => {
            controller.enqueue(chunk);
          });
          downloadStream.on('end', () => controller.close());
          downloadStream.on('error', (err) => controller.error(err));
        },
        cancel() {
          downloadStream.destroy();
        },
      });

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': chunkSize.toString(),
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          ...corsHeaders,
        },
      });
    }

    // ── Initial (non-range) request ────────────────────────────────────────────
    // The browser sends this first to discover file size & type.
    // We respond with full streaming — do NOT buffer everything into memory.
    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));

    const webStream = new ReadableStream({
      start(controller) {
        downloadStream.on('data', (chunk: Buffer) => {
          controller.enqueue(chunk);
        });
        downloadStream.on('end', () => controller.close());
        downloadStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        downloadStream.destroy();
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileSize.toString(),
        ...corsHeaders,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error serving file';
    console.error('Error serving file:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function HEAD(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id: fileId } = await params;

    if (!fileId || !ObjectId.isValid(fileId)) {
      return new NextResponse(null, { status: 400 });
    }

    let file = null;
    for (const bucketName of ['videos', 'thumbnails']) {
      const b = new mongoose.mongo.GridFSBucket(mongoose.connection.db!, { bucketName });
      try {
        const files = await b.find({ _id: new ObjectId(fileId) }).toArray();
        if (files.length > 0) { file = files[0]; break; }
      } catch { continue; }
    }

    if (!file) return new NextResponse(null, { status: 404 });

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': file.metadata?.mimeType || 'video/mp4',
        'Content-Length': file.length.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    },
  });
}
