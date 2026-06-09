"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface RelatedVideo {
  id: string;
  title: string;
  channel: string;
  channelAvatar: string;
  views: string;
  timestamp: string;
  thumbnail: string;
  duration: string;
  isLive?: boolean;
}

interface RelatedVideosProps {
  currentVideoId: string;
  category?: string;
}

const RelatedVideos = ({ currentVideoId, category = "all" }: RelatedVideosProps) => {
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [randomSeconds, setRandomSeconds] = useState(5);

  useEffect(() => {
    setRandomSeconds(Math.floor(Math.random() * 10) + 1);
  }, []);

  // All working thumbnail URLs - NO broken URLs
  const allRelatedVideos: RelatedVideo[] = [
    {
      id: "2",
      title: "The Future of AI in 2025 - What You Need to Know",
      channel: "TechToday",
      channelAvatar: "https://ui-avatars.com/api/?name=TechToday&background=3498DB&color=fff&size=40",
      views: "89K views",
      timestamp: "5 days ago",
      thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
      duration: "8:22",
    },
    {
      id: "3",
      title: "Top 10 JavaScript Frameworks to Learn in 2024",
      channel: "WebDev Simplified",
      channelAvatar: "https://ui-avatars.com/api/?name=WebDev&background=2ECC71&color=fff&size=40",
      views: "256K views",
      timestamp: "1 week ago",
      thumbnail: "https://images.unsplash.com/photo-1592609931095-54a2168ae893?w=400",
      duration: "15:47",
    },
    {
      id: "4",
      title: "How to Build a Startup from Scratch in 30 Days",
      channel: "Entrepreneur Life",
      channelAvatar: "https://ui-avatars.com/api/?name=Entrepreneur&background=F39C12&color=fff&size=40",
      views: "45K views",
      timestamp: "3 days ago",
      thumbnail: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400",
      duration: "22:15",
    },
    {
      id: "5",
      title: "Mastering React Server Components - Full Guide",
      channel: "React University",
      channelAvatar: "https://ui-avatars.com/api/?name=React&background=9B59B6&color=fff&size=40",
      views: "312K views",
      timestamp: "4 days ago",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
      duration: "18:42",
    },
    {
      id: "6",
      title: "Amazing Nature Documentary - 4K Ultra HD",
      channel: "NatGeo",
      channelAvatar: "https://ui-avatars.com/api/?name=NatGeo&background=1ABC9C&color=fff&size=40",
      views: "1.2M views",
      timestamp: "2 weeks ago",
      thumbnail: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400",
      duration: "45:00",
    },
    {
      id: "7",
      title: "Next.js 15 New Features Explained",
      channel: "Next.js Official",
      channelAvatar: "https://ui-avatars.com/api/?name=Nextjs&background=000000&color=fff&size=40",
      views: "98K views",
      timestamp: "1 day ago",
      thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400",
      duration: "9:18",
    },
    {
      id: "8",
      title: "CSS Grid vs Flexbox - Which One Should You Use?",
      channel: "CSS Tricks",
      channelAvatar: "https://ui-avatars.com/api/?name=CSS&background=9B59B6&color=fff&size=40",
      views: "67K views",
      timestamp: "6 days ago",
      thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400",
      duration: "14:56",
    },
    {
      id: "9",
      title: "TypeScript Tips You Need to Know",
      channel: "TypeScript Mastery",
      channelAvatar: "https://ui-avatars.com/api/?name=TS&background=3178C6&color=fff&size=40",
      views: "123K views",
      timestamp: "3 days ago",
      thumbnail: "https://images.unsplash.com/photo-1580927752452-89d86da3ab0a?w=400",
      duration: "11:23",
    },
    {
      id: "10",
      title: "Tailwind CSS Best Practices",
      channel: "Tailwind Labs",
      channelAvatar: "https://ui-avatars.com/api/?name=TW&background=06B6D4&color=fff&size=40",
      views: "78K views",
      timestamp: "1 week ago",
      thumbnail: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=400",
      duration: "10:45",
    },
    {
      id: "11",
      title: "Understanding React Hooks - Complete Guide",
      channel: "React Mastery",
      channelAvatar: "https://ui-avatars.com/api/?name=ReactHooks&background=61DAFB&color=000&size=40",
      views: "234K views",
      timestamp: "2 days ago",
      thumbnail: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400",
      duration: "32:18",
    },
    {
      id: "12",
      title: "Building APIs with Next.js 15",
      channel: "BackendPro",
      channelAvatar: "https://ui-avatars.com/api/?name=API&background=FF6B6B&color=fff&size=40",
      views: "56K views",
      timestamp: "4 days ago",
      thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400",
      duration: "25:33",
    },
  ];

  const autoplayVideos: RelatedVideo[] = [
    {
      id: "13",
      title: "UP NEXT: Building a YouTube Clone - Part 2",
      channel: "CodeMaster",
      channelAvatar: "https://ui-avatars.com/api/?name=CodeMaster&background=E74C3C&color=fff&size=40",
      views: "45K views",
      timestamp: "Streaming now",
      thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400",
      duration: "LIVE",
      isLive: true,
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const filtered = allRelatedVideos.filter(video => video.id !== currentVideoId);
      const shuffled = [...filtered].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 10);
      setRelatedVideos([...autoplayVideos, ...selected]);
      setIsLoading(false);
    }, 500);
  }, [currentVideoId, category]);

  const SkeletonLoader = () => (
    <div className="animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-3 mb-4">
          <div className="w-40 h-24 bg-gray-200 dark:bg-gray-800 rounded-lg flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-1"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Fallback image handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.src = "https://placehold.co/400x225/1E1E1E/FFFFFF?text=Video";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Related videos</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Autoplay</span>
          <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-300 dark:bg-gray-700">
            <span className="inline-block h-3 w-3 transform rounded-full bg-white transition translate-x-1"></span>
          </button>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-2 mb-2">
        <p className="text-xs text-gray-500 mb-1">Play next in {randomSeconds} seconds</p>
        <div className="w-full h-0.5 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="w-1/3 h-full bg-red-600 rounded-full animate-pulse"></div>
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <div className="space-y-3">
          {relatedVideos.map((video) => (
            <Link
              key={video.id}
              href={`/watch/${video.id}`}
              className="flex gap-3 group cursor-pointer"
            >
              <div className="relative w-40 flex-shrink-0">
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
                    onError={handleImageError}
                  />
                </div>
                <span className={`absolute bottom-1 right-1 text-white text-xs px-1 rounded ${
                  video.isLive ? "bg-red-600" : "bg-black/80"
                }`}>
                  {video.duration}
                </span>
                {video.isLive && (
                  <span className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    LIVE
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {video.title}
                </h3>
                
                <div className="flex items-center gap-1.5 mt-1">
                  <img
                    src={video.channelAvatar}
                    alt={video.channel}
                    className="w-4 h-4 rounded-full"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {video.channel}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                  <span>{video.views}</span>
                  <span>•</span>
                  <span>{video.timestamp}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && relatedVideos.length > 0 && (
        <button className="w-full mt-4 py-2 text-center text-sm text-blue-600 hover:text-blue-700 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          Show more
        </button>
      )}
    </div>
  );
};

export default RelatedVideos;