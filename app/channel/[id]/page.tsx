'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Eye, Clock, Film } from 'lucide-react';
import { getVideosByAuthor, Video } from '@/lib/db/videos';
import { getUserProfile, User } from '@/lib/db/users';

interface CombinedVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  authorName: string;
  authorPhotoUrl?: string;
  views: number;
  likes: number;
  createdAt: number;
  source: 'firestore' | 'mongodb';
}

const timeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
};

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.id as string;
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [videos, setVideos] = useState<CombinedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        // Fetch Firestore user profile + Firestore videos in parallel
        const [profile, firestoreVideos] = await Promise.all([
          getUserProfile(channelId),
          getVideosByAuthor(channelId),
        ]);

        setUserProfile(profile);

        // Map Firestore videos to combined format
        const fsVideos: CombinedVideo[] = firestoreVideos.map((v: Video) => ({
          id: v.id,
          title: v.title,
          thumbnailUrl: v.thumbnailUrl,
          videoUrl: v.videoUrl,
          authorName: v.authorName,
          authorPhotoUrl: v.authorPhotoUrl,
          views: v.views || 0,
          likes: v.likes || 0,
          createdAt: v.createdAt,
          source: 'firestore' as const,
        }));

        // Fetch MongoDB videos for this userId
        let mongoVideos: CombinedVideo[] = [];
        try {
          const res = await fetch(`/api/uploads-list?userId=${channelId}&limit=50`);
          if (res.ok) {
            const data = await res.json();
            if (data.uploads && Array.isArray(data.uploads)) {
              mongoVideos = data.uploads.map((u: {
                id: string;
                title: string;
                thumbnailUrl: string;
                videoUrl: string;
                authorName: string;
                authorPhotoUrl?: string;
                views?: number;
                likes?: number;
                createdAt: string | number;
              }) => ({
                id: String(u.id),
                title: u.title,
                thumbnailUrl: u.thumbnailUrl,
                videoUrl: u.videoUrl,
                authorName: u.authorName || 'Unknown',
                authorPhotoUrl: u.authorPhotoUrl,
                views: u.views || 0,
                likes: u.likes || 0,
                createdAt: typeof u.createdAt === 'string' ? new Date(u.createdAt).getTime() : u.createdAt,
                source: 'mongodb' as const,
              }));
            }
          }
        } catch {
          // MongoDB might not be available — silently ignore
        }

        // Merge and sort by newest first, deduplicate by id
        const seenIds = new Set<string>();
        const allVideos = [...fsVideos, ...mongoVideos].filter((v) => {
          if (seenIds.has(v.id)) return false;
          seenIds.add(v.id);
          return true;
        });
        allVideos.sort((a, b) => b.createdAt - a.createdAt);

        setVideos(allVideos);
      } catch (err) {
        setError('Failed to load channel');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (channelId) fetchChannelData();
  }, [channelId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        {/* Skeleton banner */}
        <div className="h-40 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 animate-pulse" />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-end gap-5 mb-10">
            <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse -mt-14 ring-4 ring-white dark:ring-gray-950" />
            <div className="pb-1 space-y-2">
              <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video rounded-xl bg-gray-200 dark:bg-gray-700 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile && videos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">{error || 'Channel not found'}</h2>
          <p className="text-gray-400 mt-2">This channel may not exist or has no content yet.</p>
        </div>
      </div>
    );
  }

  const displayName = userProfile?.displayName || 'Channel';
  const photoURL = userProfile?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=ef4444&color=fff&size=128`;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Channel Banner */}
      <div className="relative h-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-500 to-orange-400" />
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                              radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Channel Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 -mt-10 mb-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Image
              src={photoURL}
              alt={displayName}
              width={120}
              height={120}
              className="rounded-full ring-4 ring-white dark:ring-gray-950 object-cover shadow-lg"
            />
          </div>
          {/* Meta */}
          <div className="pb-1 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {displayName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Film className="w-3.5 h-3.5" />
                {videos.length} video{videos.length !== 1 ? 's' : ''}
              </span>
              {userProfile?.email && (
                <span className="text-gray-400 dark:text-gray-500">@{userProfile.email.split('@')[0]}</span>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-gray-200 dark:border-gray-800 mb-8">
          <div className="flex gap-6 pb-0">
            <button className="pb-3 text-sm font-semibold text-gray-900 dark:text-white border-b-2 border-red-600">
              Videos
            </button>
          </div>
        </div>

        {/* Videos Grid */}
        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Play className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No videos yet</h3>
            <p className="text-gray-400 mt-1 max-w-xs">
              This channel hasn&apos;t uploaded any videos yet. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-12">
            {videos.map((video) => (
              <Link
                key={video.id}
                href={`/watch/${video.id}`}
                className="group block"
                onMouseEnter={() => setHoveredId(video.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-xl transition-all duration-300">
                  {video.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                      <Play className="w-10 h-10 text-gray-400" />
                    </div>
                  )}

                  {/* Play Overlay */}
                  <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-200 ${hoveredId === video.id ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-200">
                      <Play className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" />
                    </div>
                  </div>

                  {/* Source badge (only for MongoDB uploaded videos) */}
                  {video.source === 'mongodb' && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      NEW
                    </span>
                  )}
                </div>

                {/* Video Info */}
                <div className="mt-3 flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Image
                      src={photoURL}
                      alt={displayName}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {video.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {video.views.toLocaleString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(video.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}