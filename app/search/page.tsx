'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Clock, Eye } from 'lucide-react';
import { getAllVideos, Video } from '@/lib/db/videos';

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
  return `${views} views`;
}

function timeAgo(ms: number | string): string {
  const date = typeof ms === 'string' ? new Date(ms) : new Date(ms);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) !== 1 ? 's' : ''} ago`;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

      // Firestore search (client-side filter)
      const allFirestore = await getAllVideos();
      const firestoreMatches = allFirestore.filter(
        (v) => regex.test(v.title) || regex.test(v.description || '') || regex.test(v.category || '')
      );

      // MongoDB search via API
      let mongoResults: Video[] = [];
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=40`);
        if (res.ok) {
          const data = await res.json();
          mongoResults = (data.uploads || []).map((u: {
            id: string; title: string; description: string; thumbnailUrl: string;
            videoUrl: string; category: string; views: number; likes: number;
            createdAt: string; authorName: string; authorPhotoUrl?: string;
          }) => ({
            id: u.id,
            title: u.title,
            description: u.description,
            thumbnailUrl: u.thumbnailUrl,
            videoUrl: u.videoUrl,
            authorId: 'uploaded',
            authorName: u.authorName,
            authorPhotoUrl: u.authorPhotoUrl,
            views: u.views,
            likes: u.likes,
            createdAt: new Date(u.createdAt).getTime(),
            updatedAt: new Date(u.createdAt).getTime(),
            category: u.category,
          }));
        }
      } catch (_) { /* MongoDB might not be available */ }

      // Merge, deduplicate by id, sort by views desc
      const seen = new Set<string>();
      const merged = [...firestoreMatches, ...mongoResults]
        .filter((v) => { if (seen.has(v.id)) return false; seen.add(v.id); return true; })
        .sort((a, b) => (b.views || 0) - (a.views || 0));

      setResults(merged);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { doSearch(query); }, [query, doSearch]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 pb-4 border-b dark:border-gray-700">
        {query ? (
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {loading ? 'Searching…' : `${results.length} result${results.length !== 1 ? 's' : ''} for`}&nbsp;
            <span className="font-semibold text-gray-900 dark:text-white">"{query}"</span>
          </p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Enter a search term above to find videos.</p>
        )}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-64 h-36 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && query && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold">No results for "{query}"</h2>
          <p className="text-gray-500 text-sm max-w-sm">
            Try different keywords, or check the spelling of your search.
          </p>
        </div>
      )}

      {/* Results list */}
      {!loading && results.length > 0 && (
        <div className="space-y-5">
          {results.map((video) => (
            <Link
              key={video.id}
              href={`/watch/${video.id}`}
              className="flex gap-4 group hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-xl p-2 -mx-2 transition-colors"
            >
              {/* Thumbnail */}
              <div className="relative w-64 h-36 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex-shrink-0">
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="font-semibold text-base line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {video.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {formatViews(video.views || 0)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {timeAgo(video.createdAt)}
                  </span>
                  {video.category && (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                      {video.category}
                    </span>
                  )}
                </div>
                {/* Channel */}
                <div className="flex items-center gap-2 mb-2">
                  <Image
                    src={video.authorPhotoUrl || 'https://randomuser.me/api/portraits/men/1.jpg'}
                    alt={video.authorName}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {video.authorName}
                  </span>
                </div>
                {/* Description snippet */}
                {video.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {video.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="space-y-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-64 h-36 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
