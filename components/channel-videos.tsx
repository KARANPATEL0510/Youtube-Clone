"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Video, 
  Lock, 
  Trash2, 
  Eye,
  Calendar,
  Search,
  X,
  AlertCircle
} from "lucide-react";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  timestamp: string;
  duration: string;
  visibility: "public" | "unlisted" | "private";
  createdAt: string;
}

interface ChannelVideosProps {
  channelId: string;
  isOwnChannel?: boolean;
  onVideoDelete?: (videoId: string) => void;
  maxItems?: number;
  showSearch?: boolean;
}

const ChannelVideos = ({ 
  channelId,
  isOwnChannel = false,
  onVideoDelete,
  maxItems,
  showSearch = true
}: ChannelVideosProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Load videos from localStorage
  useEffect(() => {
    const loadVideos = () => {
      const savedVideos = localStorage.getItem(`channel_${channelId}_videos`);
      if (savedVideos) {
        const parsedVideos = JSON.parse(savedVideos);
        setVideos(parsedVideos);
      } else {
        // Sample videos
        const sampleVideos: Video[] = [
          {
            id: "1",
            title: "Building a YouTube Clone with Next.js and shadcn/ui",
            thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400",
            views: "124K views",
            timestamp: "2 days ago",
            duration: "45:30",
            visibility: "public",
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          },
          {
            id: "2",
            title: "React Server Components Explained",
            thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
            views: "89K views",
            timestamp: "1 week ago",
            duration: "22:15",
            visibility: "public",
            createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          },
        ];
        setVideos(sampleVideos);
        localStorage.setItem(`channel_${channelId}_videos`, JSON.stringify(sampleVideos));
      }
      setIsLoading(false);
    };
    
    loadVideos();
    
    // Listen for storage events to update when new videos are added
    const handleStorageChange = () => {
      loadVideos();
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [channelId]);

  const handleDeleteVideo = (videoId: string) => {
    if (confirm("Delete this video?")) {
      const updatedVideos = videos.filter(v => v.id !== videoId);
      setVideos(updatedVideos);
      localStorage.setItem(`channel_${channelId}_videos`, JSON.stringify(updatedVideos));
      if (onVideoDelete) onVideoDelete(videoId);
    }
  };

  const filteredVideos = videos
    .filter(video => searchQuery === "" || video.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, maxItems);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-40 h-24 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-16">
        <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
        <p className="text-gray-500">
          {isOwnChannel 
            ? "Upload your first video to get started"
            : "This channel hasn't uploaded any videos yet"}
        </p>
      </div>
    );
  }

  return (
    <div>
      {showSearch && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-full focus:outline-none focus:border-blue-500 text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No videos found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVideos.map((video) => (
            <div key={video.id} className="flex gap-4 group relative">
              <Link href={`/watch/${video.id}`} className="flex-shrink-0">
                <div className="relative w-40">
                  <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                    {video.thumbnail && video.thumbnail.startsWith("data:image") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition"
                      />
                    ) : (
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        width={160}
                        height={90}
                        className="object-cover w-full h-full group-hover:scale-105 transition"
                        unoptimized={video.thumbnail?.startsWith("data:image")}
                      />
                    )}
                  </div>
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                    {video.duration}
                  </span>
                  {video.visibility === "private" && (
                    <span className="absolute top-1 left-1 bg-gray-800/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Private
                    </span>
                  )}
                </div>
              </Link>
              
              <div className="flex-1 min-w-0">
                <Link href={`/watch/${video.id}`}>
                  <h3 className="font-semibold text-base hover:text-blue-600 line-clamp-2">
                    {video.title}
                  </h3>
                </Link>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{video.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{video.timestamp}</span>
                  </div>
                </div>
              </div>
              
              {isOwnChannel && (
                <button
                  onClick={() => handleDeleteVideo(video.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChannelVideos;