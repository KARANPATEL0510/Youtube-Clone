'use client';
import { useEffect, useState } from 'react';
import { getAllVideos, Video } from '@/lib/db/videos';
import VideoCard from '@/components/video-card';
import { Compass } from 'lucide-react';

const CATEGORIES = ['All', 'Music', 'Gaming', 'Sports', 'News', 'Science & Technology', 'Film & Animation', 'Education', 'Travel & Events', 'Howto & Style', 'Comedy', 'Entertainment'];

export default function ExplorePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filtered, setFiltered] = useState<Video[]>([]);
  const [selected, setSelected] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const firestoreVideos = await getAllVideos();
        let mongoVideos: Video[] = [];
        try {
          const res = await window.fetch('/api/uploads-list?limit=100');
          if (res.ok) {
            const data = await res.json();
            mongoVideos = data.uploads
              .filter((u: { isPremiumContent?: boolean }) => !u.isPremiumContent)
              .map((u: {
                id: string; title: string; description: string;
                thumbnailUrl: string; videoUrl: string; category: string;
                views: number; likes: number; createdAt: string;
                authorName: string; authorPhotoUrl?: string;
              }) => ({
                id: u.id, title: u.title, description: u.description,
                thumbnailUrl: u.thumbnailUrl, videoUrl: u.videoUrl,
                authorId: 'uploaded', authorName: u.authorName,
                authorPhotoUrl: u.authorPhotoUrl, views: u.views,
                likes: u.likes, createdAt: new Date(u.createdAt).getTime(),
                updatedAt: new Date(u.createdAt).getTime(), category: u.category, comments: 0,
              }));
          }
        } catch {}
        const all = [...firestoreVideos, ...mongoVideos].sort((a, b) => b.createdAt - a.createdAt);
        setVideos(all);
        setFiltered(all);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    setFiltered(selected === 'All' ? videos : videos.filter(v => v.category === selected));
  }, [selected, videos]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
          <Compass className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Explore</h1>
          <p className="text-sm text-gray-500">Discover videos by category</p>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelected(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              selected === cat
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No videos in {selected}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map(video => <VideoCard key={video.id} video={video} />)}
        </div>
      )}
    </div>
  );
}
