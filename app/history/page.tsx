'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { getHistory } from '@/lib/db/interactions';
import { getVideo } from '@/lib/db/videos';
import { Video } from '@/lib/db/videos';
import VideoCard from '@/components/video-card';

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      const fetchHistory = async () => {
        try {
          const rawVideoIds = await getHistory(user.uid);
          
          // Deduplicate IDs (same video watched multiple times) to avoid duplicate React keys
          const videoIds = [...new Set(rawVideoIds)];
          
          // Fetch full video details for each video ID
          const videoPromises = videoIds.map((videoId) => getVideo(videoId));
          const videoData = await Promise.all(videoPromises);
          
          // Filter out any null videos
          const validVideos = videoData.filter((v) => v !== null) as Video[];
          setVideos(validVideos);
        } catch (err) {
          setError('Failed to load history');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchHistory();
    } else if (!authLoading && !user) {
      setError('Please log in to view your history');
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
      <h1 className="text-3xl font-bold mb-6">Watch History</h1>

      {videos.length === 0 ? (
        <p className="text-gray-600">No videos in your history yet</p>
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