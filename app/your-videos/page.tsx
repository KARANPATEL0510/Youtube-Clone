'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import VideoCard from '@/components/video-card';
import { Video } from '@/lib/db/videos';

export default function YourVideosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchVideos = async () => {
      try {
        setUploading(true);
        const res = await fetch(`/api/uploads-list?userId=${user.uid}`);
        if (!res.ok) throw new Error('Failed to fetch videos');

        const data = await res.json();
        
        // Transform MongoDB uploads to Video interface
        const transformedVideos: Video[] = data.uploads.map((upload: {
          id: string;
          title: string;
          description: string;
          thumbnailUrl: string;
          videoUrl: string;
          category: string;
          views: number;
          likes: number;
          createdAt: string;
          authorName: string;
          authorPhotoUrl?: string;
        }) => ({
          id: upload.id,
          title: upload.title,
          description: upload.description,
          thumbnailUrl: upload.thumbnailUrl,
          videoUrl: upload.videoUrl,
          authorId: user.uid,
          authorName: upload.authorName,
          authorPhotoUrl: upload.authorPhotoUrl,
          views: upload.views,
          likes: upload.likes,
          createdAt: new Date(upload.createdAt).getTime(),
          updatedAt: new Date(upload.createdAt).getTime(),
          category: upload.category,
          comments: 0,
        }));

        setVideos(transformedVideos);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load videos');
        console.error(err);
      } finally {
        setUploading(false);
      }
    };

    fetchVideos();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Please log in to view your videos</p>
        <button
          onClick={() => router.push('/auth/login')}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Videos</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {videos.length} video{videos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {uploading && (
        <div className="text-center py-8">Loading your videos...</div>
      )}

      {!uploading && videos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">You haven&apos;t uploaded any videos yet</p>
          <button
            onClick={() => router.push('/upload')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Upload Your First Video
          </button>
        </div>
      )}

      {!uploading && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
