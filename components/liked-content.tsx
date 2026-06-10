"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ThumbsUp, 
  Trash2, 
  X, 
  Search, 
  Filter,
  ChevronDown,
  Eye,
  Calendar,
  AlertCircle,
  ChevronRight
} from "lucide-react";

interface LikedVideo {
  id: string;
  title: string;
  channel: string;
  channelAvatar: string;
  thumbnail: string;
  views: string;
  timestamp: string;
  likedAt: string;
  duration: string;
}

interface LikedContentProps {
  maxItems?: number;
  showHeader?: boolean;
  showClearAll?: boolean;
  onItemClick?: () => void;
}

const LikedContent = ({ 
  maxItems, 
  showHeader = true, 
  showClearAll = true,
  onItemClick 
}: LikedContentProps) => {
  const [likedVideos, setLikedVideos] = useState<LikedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "today" | "week" | "month">("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Sample liked videos data
  const sampleLikedVideos: LikedVideo[] = [
    {
      id: "1",
      title: "Building a YouTube Clone with Next.js and shadcn/ui",
      channel: "CodeMaster",
      channelAvatar: "https://ui-avatars.com/api/?name=CodeMaster&background=E74C3C&color=fff&size=32",
      thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400",
      views: "124K views",
      timestamp: "2 days ago",
      likedAt: new Date().toISOString(),
      duration: "45:30",
    },
    {
      id: "2",
      title: "The Future of AI in 2025",
      channel: "TechToday",
      channelAvatar: "https://ui-avatars.com/api/?name=TechToday&background=3498DB&color=fff&size=32",
      thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
      views: "89K views",
      timestamp: "5 days ago",
      likedAt: new Date(Date.now() - 86400000).toISOString(),
      duration: "22:15",
    },
    {
      id: "3",
      title: "Top 10 JavaScript Frameworks to Learn",
      channel: "WebDev Simplified",
      channelAvatar: "https://ui-avatars.com/api/?name=WebDev&background=2ECC71&color=fff&size=32",
      thumbnail: "https://images.unsplash.com/photo-1592609931095-54a2168ae893?w=400",
      views: "256K views",
      timestamp: "1 week ago",
      likedAt: new Date(Date.now() - 172800000).toISOString(),
      duration: "18:42",
    },
    {
      id: "4",
      title: "How to Build a Startup from Scratch",
      channel: "Entrepreneur Life",
      channelAvatar: "https://ui-avatars.com/api/?name=Entrepreneur&background=F39C12&color=fff&size=32",
      thumbnail: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400",
      views: "45K views",
      timestamp: "3 days ago",
      likedAt: new Date(Date.now() - 259200000).toISOString(),
      duration: "32:10",
    },
    {
      id: "5",
      title: "Mastering React Server Components",
      channel: "React University",
      channelAvatar: "https://ui-avatars.com/api/?name=React&background=9B59B6&color=fff&size=32",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
      views: "312K views",
      timestamp: "4 days ago",
      likedAt: new Date(Date.now() - 345600000).toISOString(),
      duration: "28:33",
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const savedLiked = localStorage.getItem("likedVideos");
      if (savedLiked) {
        setLikedVideos(JSON.parse(savedLiked));
      } else {
        setLikedVideos(sampleLikedVideos);
      }
      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (likedVideos.length > 0 && !isLoading) {
      localStorage.setItem("likedVideos", JSON.stringify(likedVideos));
    }
  }, [likedVideos, isLoading]);

  const handleRemoveLike = (id: string) => {
    setLikedVideos(prev => prev.filter(video => video.id !== id));
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to remove all liked videos?")) {
      setLikedVideos([]);
      localStorage.removeItem("likedVideos");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const filterVideos = () => {
    let filtered = [...likedVideos];
    
    if (searchQuery) {
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.channel.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    switch (filterType) {
      case "today":
        filtered = filtered.filter(video => new Date(video.likedAt) >= today);
        break;
      case "week":
        filtered = filtered.filter(video => new Date(video.likedAt) >= weekAgo);
        break;
      case "month":
        filtered = filtered.filter(video => new Date(video.likedAt) >= monthAgo);
        break;
      default:
        break;
    }
    
    filtered.sort((a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime());
    
    if (maxItems) {
      filtered = filtered.slice(0, maxItems);
    }
    
    return filtered;
  };

  const filteredVideos = filterVideos();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-40 h-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (likedVideos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <ThumbsUp className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="font-semibold mb-1">No liked videos</h3>
        <p className="text-sm text-gray-500">Videos you like will appear here</p>
        <Link
          href="/"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition"
          onClick={onItemClick}
        >
          Browse videos
        </Link>
      </div>
    );
  }

  return (
    <div className="liked-content">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
              <ThumbsUp className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Liked videos</h2>
              <p className="text-sm text-gray-500">{likedVideos.length} videos</p>
            </div>
          </div>
          
          {showClearAll && likedVideos.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Search and Filter Bar - Only show for full view */}
      {likedVideos.length > 0 && !maxItems && (
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search liked videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full focus:outline-none focus:border-blue-500 dark:bg-gray-900 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm"
            >
              <Filter className="w-4 h-4" />
              <span>
                {filterType === "all" && "All time"}
                {filterType === "today" && "Today"}
                {filterType === "week" && "This week"}
                {filterType === "month" && "This month"}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  {[
                    { value: "all", label: "All time" },
                    { value: "today", label: "Today" },
                    { value: "week", label: "This week" },
                    { value: "month", label: "This month" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilterType(option.value as any);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                        filterType === option.value ? "bg-gray-100 dark:bg-gray-700 font-semibold" : ""
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* No results */}
      {filteredVideos.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No matching videos found</p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Liked Videos List */}
      {filteredVideos.length > 0 && (
        <div className="space-y-4">
          {filteredVideos.map((video) => (
            <LikedVideoRow
              key={video.id}
              video={video}
              onRemove={() => handleRemoveLike(video.id)}
              onItemClick={onItemClick}
              compact={!!maxItems}
            />
          ))}
        </div>
      )}

      {/* View All Link */}
      {maxItems && likedVideos.length > (maxItems || 0) && (
        <Link
          href="/liked"
          className="flex items-center justify-center gap-1 mt-4 text-sm text-blue-600 hover:text-blue-700 font-semibold"
          onClick={onItemClick}
        >
          View all liked videos
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
};

// Liked Video Row Component
interface LikedVideoRowProps {
  video: LikedVideo;
  onRemove: () => void;
  onItemClick?: () => void;
  compact?: boolean;
}

const LikedVideoRow = ({ video, onRemove, onItemClick, compact = false }: LikedVideoRowProps) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleRemove = () => {
    onRemove();
    setShowRemoveConfirm(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  if (compact) {
    return (
      <Link
        href={`/watch/${video.id}`}
        onClick={onItemClick}
        className="flex gap-3 group cursor-pointer"
      >
        <div className="relative w-32 flex-shrink-0">
          <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
            <Image
              src={video.thumbnail}
              alt={video.title}
              width={128}
              height={72}
              className="object-cover w-full h-full group-hover:scale-105 transition"
            />
          </div>
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
            {video.duration}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600">
            {video.title}
          </h4>
          <p className="text-xs text-gray-500 mt-1">{video.channel}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{video.views}</span>
            <span>•</span>
            <span>{video.timestamp}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="flex gap-4 group relative">
      <Link href={`/watch/${video.id}`} onClick={onItemClick} className="flex gap-4 flex-1">
        <div className="relative w-40 flex-shrink-0">
          <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
            <Image
              src={video.thumbnail}
              alt={video.title}
              width={160}
              height={90}
              className="object-cover w-full h-full group-hover:scale-105 transition"
            />
          </div>
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
            {video.duration}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base hover:text-blue-600 line-clamp-2">
            {video.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Image
              src={video.channelAvatar}
              alt={video.channel}
              width={20}
              height={20}
              className="rounded-full"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {video.channel}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{video.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{video.timestamp}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              <span>Liked {formatDate(video.likedAt)}</span>
            </div>
          </div>
        </div>
      </Link>
      
      <div className="relative">
        <button
          onClick={() => setShowRemoveConfirm(!showRemoveConfirm)}
          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          title="Remove from liked videos"
        >
          <Trash2 className="w-4 h-4 text-gray-500" />
        </button>
        
        {showRemoveConfirm && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2 z-20">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Remove from liked videos?</p>
            <div className="flex gap-2">
              <button
                onClick={handleRemove}
                className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
              >
                Remove
              </button>
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="flex-1 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedContent;