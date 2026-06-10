'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { Upload, X } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [hasChannel, setHasChannel] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');

  useEffect(() => {
    if (!user) return;

    const fetchChannel = async () => {
      try {
        const res = await fetch(`/api/channels?userId=${user.uid}`);
        if (res.ok) {
          setHasChannel(true);
        } else {
          setError('Please create a channel before uploading videos');
        }
      } catch (fetchError) {
        console.error(fetchError);
        setError('Unable to verify channel');
      }
    };

    fetchChannel();
  }, [user]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Please log in to upload videos</p>
        <button
          onClick={() => router.push('/auth/login')}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
        >
          Log In
        </button>
      </div>
    );
  }

  if (!hasChannel) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push('/create-channel')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Channel
        </button>
      </div>
    );
  }

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024 * 1024) {
        setError('Video file must be less than 5GB');
        return;
      }
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }
      // All formats supported — non-MP4 are auto-converted server-side
      const ext = file.name.split('.').pop()?.toLowerCase();
      const willConvert = ['mov', 'avi', 'mkv', 'flv'].includes(ext ?? '');
      if (willConvert) {
        setError(null); // clear any old error
      } else {
        setError(null);
      }
      setVideoFile(file);
    }
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Thumbnail must be less than 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      setThumbnailFile(file);
      setError(null);
    }
  };

  const uploadFileToMongoDB = async (file: File, fileType: 'video' | 'thumbnail'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.uid);
    formData.append('fileType', fileType);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'File upload failed');
    }

    const data = await response.json();
    return data.url;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploading(true);

    try {
      if (!title) {
        throw new Error('Please fill in the video title');
      }

      let finalVideoUrl = videoUrl;
      let finalThumbnailUrl = thumbnailUrl;

      // Handle file uploads
      if (uploadMode === 'file') {
        if (!videoFile) {
          throw new Error('Please select a video file');
        }
        if (!thumbnailFile) {
          throw new Error('Please select a thumbnail file');
        }

        setError('Uploading and converting video… This may take a few minutes for large or non-MP4 files.');
        finalVideoUrl = await uploadFileToMongoDB(videoFile, 'video');
        finalThumbnailUrl = await uploadFileToMongoDB(thumbnailFile, 'thumbnail');
        setError(null);
      } else {
        if (!videoUrl || !thumbnailUrl) {
          throw new Error('Please fill in all required fields');
        }
      }

      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          title,
          description,
          category: category || 'General',
          videoUrl: finalVideoUrl,
          thumbnailUrl: finalThumbnailUrl,
          visibility,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      await res.json();
      router.push('/channel-dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Upload Video</h1>

      {/* Format Support Info */}
      <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded mb-4 text-sm">
        <p className="font-semibold mb-1">✓ All video formats supported</p>
        <p className="text-xs">MP4, WebM, MOV, AVI, MKV — non-MP4 formats are automatically converted to MP4 on upload.</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Upload Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setUploadMode('file')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
            uploadMode === 'file'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
          disabled={uploading}
        >
          <Upload className="inline w-4 h-4 mr-2" />
          Upload from Device
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('url')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
            uploadMode === 'url'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
          disabled={uploading}
        >
          Link
        </button>
      </div>

      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Video Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="My awesome video"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Describe your video..."
            rows={4}
            disabled={uploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            disabled={uploading}
          >
            <option value="">Select a category</option>
            <option value="Music">Music</option>
            <option value="Gaming">Gaming</option>
            <option value="Education">Education</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Sports">Sports</option>
            <option value="Tech">Tech</option>
            <option value="Vlog">Vlog</option>
          </select>
        </div>

        {uploadMode === 'file' ? (
          <>
            {/* Video File Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Video File *</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-red-300 rounded-lg cursor-pointer hover:bg-red-50 transition">
                  <Upload className="w-5 h-5 text-red-600" />
                  <span className="text-red-600 font-medium">Choose video file</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              {videoFile && (
                <div className="mt-2 flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                  <span className="text-sm text-green-700">
                    ✓ {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)}MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setVideoFile(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Max 5GB. Formats: MP4, WebM, MOV, etc.</p>
            </div>

            {/* Thumbnail File Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Thumbnail Image *</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-red-300 rounded-lg cursor-pointer hover:bg-red-50 transition">
                  <Upload className="w-5 h-5 text-red-600" />
                  <span className="text-red-600 font-medium">Choose thumbnail</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailFileChange}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              {thumbnailFile && (
                <div className="mt-2 flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                  <span className="text-sm text-green-700">
                    ✓ {thumbnailFile.name} ({(thumbnailFile.size / 1024).toFixed(2)}KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setThumbnailFile(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Max 10MB. Formats: JPG, PNG, WebP</p>
            </div>
          </>
        ) : (
          <>
            {/* Video URL Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Video URL *</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="https://example.com/video.mp4"
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-1">Direct link to MP4 or HLS stream</p>
            </div>

            {/* Thumbnail URL Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Thumbnail URL *</label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="https://example.com/thumbnail.jpg"
                disabled={uploading}
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            disabled={uploading}
          >
            <option value="public">Public - Anyone can find and watch</option>
            <option value="unlisted">Unlisted - Only people with link can watch</option>
            <option value="private">Private - Only you can watch</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={uploading || (uploadMode === 'file' && (!videoFile || !thumbnailFile))}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>

      <p className="text-sm text-gray-600 mt-8">
        * Required fields. {uploadMode === 'file' ? 'Files will be uploaded to cloud storage.' : 'Note: Use externally hosted video URLs or Firebase Storage links.'}
      </p>
    </div>
  );
}
