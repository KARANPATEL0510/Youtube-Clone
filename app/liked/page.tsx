'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { getLikedVideos } from '@/lib/db/interactions';
import { getVideo } from '@/lib/db/videos';
import { Video } from '@/lib/db/videos';
import VideoCard from '@/components/video-card';

export default function LikedPage() {
  const { user, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      const fetchLikedVideos = async () => {
        try {
          // Get liked video IDs
          const likedVideoIds = await getLikedVideos(user.uid);
          
          // Fetch full video details for each video ID
          const videoPromises = likedVideoIds.map((videoId) => getVideo(videoId));
          const videoData = await Promise.all(videoPromises);
          
          // Filter out any null videos
          const validVideos = videoData.filter((v) => v !== null) as Video[];
          setVideos(validVideos);
        } catch (err) {
          setError('Failed to load liked videos');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchLikedVideos();
    } else if (!authLoading && !user) {
      setError('Please log in to view your liked videos');
      setLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Liked Videos</h1>

      {videos.length === 0 ? (
        <p className="text-gray-600">No liked videos yet</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}