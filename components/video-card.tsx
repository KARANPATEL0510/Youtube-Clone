'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Clock } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { likeVideo, unlikeVideo, addToWatchLater } from '@/lib/db/interactions';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnailUrl: string;
    authorName: string;
    authorPhotoUrl?: string;
    views: number;
    likes: number;
    createdAt: number;
  };
}

const VideoCard = ({ video }: VideoCardProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to like videos');
      return;
    }

    try {
      if (isLiked) {
        await unlikeVideo(user.uid, video.id);
        setIsLiked(false);
        setLikeCount(likeCount - 1);
      } else {
        await likeVideo(user.uid, video.id);
        setIsLiked(true);
        setLikeCount(likeCount + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleWatchLater = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to save videos');
      return;
    }

    try {
      await addToWatchLater(user.uid, video.id);
      alert('Added to watch later!');
    } catch (error) {
      console.error('Error adding to watch later:', error);
    }
  };

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'now';
  };

  return (
    <Link href={`/watch/${video.id}`} className="group">
      <div className="flex flex-col gap-2">
        {/* Thumbnail */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleLike}
              className={`p-2 rounded-full ${
                isLiked ? 'bg-red-600' : 'bg-black/60'
              } text-white hover:bg-red-700 transition`}
              title="Like"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleWatchLater}
              className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              title="Watch later"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Info */}
        <div className="flex gap-3">
          {/* Channel Avatar */}
          <div className="flex-shrink-0">
            <Image
              src={video.authorPhotoUrl || 'https://randomuser.me/api/portraits/men/1.jpg'}
              alt={video.authorName}
              width={36}
              height={36}
              className="rounded-full object-cover"
            />
          </div>

          {/* Title and Metadata */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold line-clamp-2 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {video.title}
            </h3>
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/channel/${video.authorName}`);
              }}
              className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate hover:text-gray-900 cursor-pointer hover:underline"
            >
              {video.authorName}
            </div>
            <div className="flex gap-1 text-sm text-gray-600 dark:text-gray-400">
              <span>{video.views.toLocaleString()} views</span>
              <span>•</span>
              <span>{timeAgo(video.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;