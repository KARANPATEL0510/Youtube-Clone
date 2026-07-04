'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { Upload, X, Link2, Film, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react';

const CATEGORIES = [
  'Music', 'Gaming', 'Education', 'Entertainment',
  'Sports', 'Tech', 'Vlog', 'News', 'Comedy', 'Film & Animation',
  'Science & Technology', 'Travel & Events', 'Pets & Animals', 'General',
];

const VISIBILITY_OPTIONS = [
  { value: 'public',   label: 'Public',   sub: 'Anyone can find and watch' },
  { value: 'unlisted', label: 'Unlisted', sub: 'Only people with the link can watch' },
  { value: 'private',  label: 'Private',  sub: 'Only you can watch' },
];

/* ── Tiny custom select so we control all styling ─────────────── */
function CustomSelect({
  value, onChange, options, placeholder, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; sub?: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(p => !p)}
        className={`
          w-full flex items-center justify-between px-4 py-3
          bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700
          text-gray-900 dark:text-white rounded-xl
          focus:outline-none focus:ring-2 focus:ring-red-500
          transition hover:border-gray-400 dark:hover:border-zinc-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className={selected ? '' : 'text-gray-400 dark:text-zinc-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {placeholder && (
            <div
              onClick={() => { onChange(''); setOpen(false); }}
              className="px-4 py-2.5 text-sm text-gray-400 dark:text-zinc-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700"
            >
              {placeholder}
            </div>
          )}
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`
                px-4 py-2.5 cursor-pointer transition
                ${opt.value === value
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-medium'
                  : 'text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700'}
              `}
            >
              <div className="text-sm font-medium">{opt.label}</div>
              {opt.sub && <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{opt.sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── File drop zone ─────────────────────────────────────────────── */
function FileDropZone({
  accept, onFile, file, onClear, label, hint, icon: Icon, disabled,
}: {
  accept: string;
  onFile: (f: File) => void;
  file: File | null;
  onClear: () => void;
  label: string;
  hint: string;
  icon: React.ElementType;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  if (file) {
    return (
      <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-green-800 dark:text-green-300 truncate">{file.name}</p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {file.size > 1024 * 1024
                ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                : `${(file.size / 1024).toFixed(2)} KB`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="ml-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-xl px-6 py-8
        flex flex-col items-center gap-3 cursor-pointer transition
        ${dragging
          ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
          : 'border-gray-200 dark:border-zinc-700 hover:border-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/10'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
        <Icon className="w-6 h-6 text-red-600 dark:text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{hint}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────── */
export default function UploadPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [hasChannel, setHasChannel] = useState<boolean | null>(null);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');

  useEffect(() => {
    if (!user) return;
    fetch(`/api/channels?userId=${user.uid}`)
      .then(res => setHasChannel(res.ok))
      .catch(() => setHasChannel(false));
  }, [user]);

  const handleVideoFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024 * 1024) { setError('Video must be under 5 GB'); return; }
    if (!file.type.startsWith('video/')) { setError('Please select a valid video file'); return; }
    setVideoFile(file); setError(null);
  };

  const handleThumbnailFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { setError('Thumbnail must be under 10 MB'); return; }
    if (!file.type.startsWith('image/')) { setError('Please select a valid image file'); return; }
    setThumbnailFile(file); setError(null);
  };

  const uploadToMongoDB = async (file: File, fileType: 'video' | 'thumbnail'): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    form.append('userId', user!.uid);
    form.append('fileType', fileType);

    let res: Response;
    try {
      res = await fetch('/api/upload', { method: 'POST', body: form });
    } catch (networkErr) {
      throw new Error('Network error — check your internet connection and try again.');
    }

    // Read response as text first so we never crash on non-JSON bodies
    const text = await res.text().catch(() => '');

    if (res.status === 413) {
      throw new Error('The server rejected the file as too large. Check that your Next.js / server body-size limit is configured correctly.');
    }

    // Try to parse as JSON
    let data: { url?: string; error?: string } = {};
    try {
      data = JSON.parse(text);
    } catch {
      // Server returned non-JSON (e.g. an HTML error page or plain text)
      const preview = text.slice(0, 200);
      throw new Error(`Server returned an unexpected response (HTTP ${res.status}): ${preview || '(empty body)'}`);
    }

    if (!res.ok) throw new Error(data.error || `Upload failed (HTTP ${res.status})`);
    if (!data.url) throw new Error('Upload succeeded but no file URL was returned. Check the server logs.');
    return data.url;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploading(true);
    setUploadStep('');

    try {
      if (!title.trim()) throw new Error('Please enter a video title');

      let finalVideoUrl = videoUrl;
      let finalThumbnailUrl = thumbnailUrl;

      if (uploadMode === 'file') {
        if (!videoFile) throw new Error('Please select a video file');
        if (!thumbnailFile) throw new Error('Please select a thumbnail image');

        setUploadStep('Uploading thumbnail…');
        finalThumbnailUrl = await uploadToMongoDB(thumbnailFile, 'thumbnail');

        setUploadStep('Uploading & processing video… This may take a few minutes.');
        finalVideoUrl = await uploadToMongoDB(videoFile, 'video');
        setUploadStep('Saving video details…');
      } else {
        if (!videoUrl.trim() || !thumbnailUrl.trim()) throw new Error('Please fill in Video URL and Thumbnail URL');
      }

      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.uid,
          title: title.trim(),
          description: description.trim(),
          category: category || 'General',
          videoUrl: finalVideoUrl,
          thumbnailUrl: finalThumbnailUrl,
          visibility,
        }),
      });

      const resText = await res.text();
      let resData: { error?: string };
      try { resData = JSON.parse(resText); } catch { resData = {}; }

      if (!res.ok) throw new Error(resData.error || 'Failed to save video');

      router.push('/channel-dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadStep('');
    }
  };

  /* ── Loading / auth guards ────────────────────────────────── */
  if (loading || hasChannel === null) {
    return (
      <div className="flex-1 min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to upload videos</p>
          <button onClick={() => router.push('/auth/login')} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">Log In</button>
        </div>
      </div>
    );
  }

  if (!hasChannel) {
    return (
      <div className="flex-1 min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create a channel first</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">You need a channel before you can upload videos</p>
          <button onClick={() => router.push('/create-channel')} className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition">
            Create Channel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Video</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-13 pl-0.5">Share your content with the world</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl mb-8">
        {([
          { mode: 'file', icon: Upload, label: 'Upload from Device' },
          { mode: 'url',  icon: Link2,  label: 'Use a URL Link' },
        ] as const).map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            type="button"
            disabled={uploading}
            onClick={() => setUploadMode(mode)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition
              ${uploadMode === mode
                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}
            `}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploadStep && (
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-xl mb-6 text-sm">
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
          <span>{uploadStep}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Video Title <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={uploading}
            placeholder="Give your video a great title"
            maxLength={150}
            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition placeholder-gray-400 dark:placeholder-zinc-500"
          />
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 text-right">{title.length}/150</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={uploading}
            placeholder="Tell viewers about your video…"
            rows={4}
            maxLength={5000}
            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none placeholder-gray-400 dark:placeholder-zinc-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
          <CustomSelect
            value={category}
            onChange={setCategory}
            placeholder="Select a category"
            disabled={uploading}
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
          />
        </div>

        {/* File upload mode */}
        {uploadMode === 'file' ? (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Video File <span className="text-red-500">*</span></label>
              <FileDropZone
                accept="video/*"
                onFile={handleVideoFile}
                file={videoFile}
                onClear={() => setVideoFile(null)}
                label="Click or drag & drop your video"
                hint="MP4, WebM, MOV, AVI, MKV · Max 5 GB"
                icon={Film}
                disabled={uploading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Thumbnail <span className="text-red-500">*</span></label>
              <FileDropZone
                accept="image/*"
                onFile={handleThumbnailFile}
                file={thumbnailFile}
                onClear={() => setThumbnailFile(null)}
                label="Click or drag & drop your thumbnail"
                hint="JPG, PNG, WebP · Max 10 MB · Recommended 1280×720"
                icon={ImageIcon}
                disabled={uploading}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Video URL <span className="text-red-500">*</span></label>
              <input
                type="url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                disabled={uploading}
                placeholder="https://example.com/video.mp4"
                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition placeholder-gray-400 dark:placeholder-zinc-500"
              />
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Direct link to MP4, WebM, or HLS stream</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Thumbnail URL <span className="text-red-500">*</span></label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={e => setThumbnailUrl(e.target.value)}
                disabled={uploading}
                placeholder="https://example.com/thumbnail.jpg"
                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition placeholder-gray-400 dark:placeholder-zinc-500"
              />
            </div>
          </>
        )}

        {/* Visibility */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Visibility</label>
          <CustomSelect
            value={visibility}
            onChange={setVisibility}
            disabled={uploading}
            options={VISIBILITY_OPTIONS}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={uploading || (uploadMode === 'file' && (!videoFile || !thumbnailFile))}
          className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 dark:disabled:from-zinc-700 dark:disabled:to-zinc-700 text-white font-bold py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2"
        >
          {uploading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Uploading…</>
          ) : (
            <><Upload className="w-5 h-5" /> Publish Video</>
          )}
        </button>

        <p className="text-xs text-center text-gray-400 dark:text-zinc-500">
          {uploadMode === 'file'
            ? '* Files are uploaded securely to cloud storage.'
            : '* Use a direct-access video URL (Firebase Storage, Cloudinary, etc.)'}
        </p>
      </form>
    </div>
  );
}
