import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { Readable } from 'stream';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, readFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';

// Allow large video file uploads — disable Next.js default 4.5MB body limit
export const maxDuration = 300; // 5 minutes timeout for large uploads

/** Formats that browsers can play natively — no conversion needed */
const BROWSER_NATIVE = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
]);

/** Derive whether conversion is needed from MIME type / file extension */
function needsConversion(mimeType: string, filename: string): boolean {
  if (BROWSER_NATIVE.has(mimeType)) return false;
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return ['mov', 'avi', 'mkv', 'flv', 'wmv', 'mpeg', 'mpg', 'm4v'].includes(ext);
}

/** Get the input format flag for FFmpeg */
function getInputFormat(mimeType: string, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (mimeType === 'video/quicktime'  || ext === 'mov') return 'mov';
  if (mimeType === 'video/x-msvideo'  || ext === 'avi') return 'avi';
  if (mimeType === 'video/x-matroska' || ext === 'mkv') return 'matroska';
  if (mimeType === 'video/x-flv'      || ext === 'flv') return 'flv';
  return 'mp4';
}

/**
 * Transcode a video buffer to browser-compatible fragmented MP4.
 * Uses temp files + child_process.spawn so Turbopack never tries to bundle FFmpeg.
 */
async function transcodeToMp4(inputBuffer: Buffer, inputFormat: string): Promise<Buffer> {
  // Get ffmpeg binary path at runtime (never imported at build time by Turbopack)
  // We use require() inside the function so the bundler never statically analyzes it
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ffmpegPath: string = require('ffmpeg-static');

  const id = randomUUID();
  const tmpDir = tmpdir();
  const inputPath  = join(tmpDir, `yt-input-${id}.${inputFormat === 'matroska' ? 'mkv' : inputFormat}`);
  const outputPath = join(tmpDir, `yt-output-${id}.mp4`);

  // Write input to temp file
  await writeFile(inputPath, inputBuffer);

  try {
    await new Promise<void>((resolve, reject) => {
      const args = [
        '-y',                          // overwrite output
        '-f', inputFormat,             // input format hint
        '-i', inputPath,               // input file
        '-c:v', 'libx264',             // H.264 video
        '-preset', 'fast',             // fast encoding
        '-crf', '23',                  // quality
        '-pix_fmt', 'yuv420p',         // max browser compatibility
        '-c:a', 'aac',                 // AAC audio
        '-movflags', 'frag_keyframe+empty_moov', // streamable MP4
        '-f', 'mp4',
        outputPath,
      ];

      const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
      const stderrLines: string[] = [];

      proc.stderr.on('data', (d: Buffer) => {
        stderrLines.push(d.toString());
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          const lastLines = stderrLines.slice(-5).join('\n');
          reject(new Error(`FFmpeg exited with code ${code}:\n${lastLines}`));
        }
      });

      proc.on('error', reject);
    });

    return await readFile(outputPath);
  } finally {
    // Clean up temp files
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();
    const file     = formData.get('file')     as File   | null;
    const userId   = formData.get('userId')   as string | null;
    const fileType = formData.get('fileType') as string | null;

    if (!file)                return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!userId || !fileType) return NextResponse.json({ error: 'userId and fileType are required' }, { status: 400 });

    const originalMime = file.type || (fileType === 'video' ? 'video/mp4' : 'image/jpeg');
    const originalName = file.name;

    let finalBuffer   = Buffer.from(await file.arrayBuffer()) as Buffer;
    let finalMime     = originalMime;
    let finalFilename = originalName;

    // ── Video: transcode to MP4 if the browser can't play it natively ──────────
    if (fileType === 'video' && needsConversion(originalMime, originalName)) {
      console.log(`[upload] Transcoding ${originalName} (${originalMime}) → MP4…`);
      const inputFormat = getInputFormat(originalMime, originalName);

      try {
        finalBuffer   = (await transcodeToMp4(finalBuffer, inputFormat)) as Buffer;
        finalMime     = 'video/mp4';
        finalFilename = originalName.replace(/\.[^.]+$/, '.mp4');
        console.log(`[upload] Transcode complete — ${finalBuffer.length} bytes`);
      } catch (err) {
        console.error('[upload] Transcode failed:', err);
        return NextResponse.json(
          { error: `Failed to convert video: ${err instanceof Error ? err.message : err}` },
          { status: 500 }
        );
      }
    }

    // ── Store in GridFS ─────────────────────────────────────────────────────────
    const bucketName = fileType === 'video' ? 'videos' : 'thumbnails';
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db!, { bucketName });
    const storedFilename = `${userId}-${Date.now()}-${finalFilename}`;

    console.log(`[upload] Storing to GridFS: ${storedFilename}, ${finalBuffer.length} bytes`);

    const fileId = await new Promise<string>((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(storedFilename, {
        metadata: {
          userId,
          fileType,
          originalName,
          mimeType: finalMime,
          uploadedAt: new Date(),
        },
      });
      uploadStream.on('finish', () => resolve(uploadStream.id.toString()));
      uploadStream.on('error', reject);
      Readable.from(finalBuffer).pipe(uploadStream);
    });

    console.log(`[upload] Stored in GridFS: ${fileId}`);
    return NextResponse.json({ url: `/api/files/${fileId}`, fileId }, { status: 200 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to upload file';
    console.error('[upload] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
