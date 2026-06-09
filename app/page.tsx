'use client';
import { useEffect, useState } from 'react';
import { getAllVideos, Video } from '@/lib/db/videos';
import VideoCard from '@/components/video-card';
import { useCategory } from '@/lib/contexts/category-context';

export default function HomePage() {
  const { selectedCategory } = useCategory();
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // Fetch Firestore videos
        const firestoreVideos = await getAllVideos();
        
        // Fetch MongoDB uploads (exclude premium content)
        let mongoVideos: Video[] = [];
        try {
          const res = await fetch('/api/uploads-list?limit=100');
          if (res.ok) {
            const data = await res.json();
            mongoVideos = data.uploads
              .filter((upload: { isPremiumContent?: boolean }) => !upload.isPremiumContent)
              .map((upload: {
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
              authorId: 'uploaded',
              authorName: upload.authorName,
              authorPhotoUrl: upload.authorPhotoUrl,
              views: upload.views,
              likes: upload.likes,
              createdAt: new Date(upload.createdAt).getTime(),
              updatedAt: new Date(upload.createdAt).getTime(),
              category: upload.category,
              comments: 0,
            }));
          }
        } catch (err) {
          console.error('Error fetching MongoDB uploads:', err);
        }


        // Combine and sort by date
        const allVideos = [...firestoreVideos, ...mongoVideos].sort((a, b) => b.createdAt - a.createdAt);
        setVideos(allVideos);
      } catch (err) {
        setError('Failed to load videos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  useEffect(() => {
    // Filter videos based on selected category
    const filtered = selectedCategory === 'All' 
      ? videos 
      : videos.filter(video => video.category === selectedCategory);
    setFilteredVideos(filtered);
  }, [selectedCategory, videos]);

  if (loading) {
    return <div className="p-8 text-center">Loading videos...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="w-full">
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredVideos.length} {selectedCategory === 'All' ? 'videos' : `${selectedCategory} videos`}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredVideos.length === 0 ? (
          <p className="col-span-full text-center text-gray-600">No videos available in {selectedCategory}</p>
        ) : (
          filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))
        )}
      </div>
    </div>
  );
}