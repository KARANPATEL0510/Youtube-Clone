'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Download, Crown, Loader2, Trash2, Play } from 'lucide-react';
import Link from 'next/link';
import PremiumModal from '@/components/premium-modal';

interface DownloadItem {
  _id: string;
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  thumbnailUrl: string;
  channelName: string;
  downloadedAt: string;
}

export default function DownloadsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth'); return; }

    const fetchData = async () => {
      const [dlRes, premRes] = await Promise.all([
        fetch(`/api/downloads?userId=${user.uid}`),
        fetch(`/api/premium/status?userId=${user.uid}`),
      ]);
      const dlData = await dlRes.json();
      const premData = await premRes.json();
      setDownloads(dlData.downloads || []);
      setIsPremium(premData.isPremium === true);
      setLoading(false);
    };

    fetchData().catch(console.error);
  }, [user, authLoading, router]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 max-w-5xl">
      {showPremiumModal && user && (
        <PremiumModal
          userId={user.uid}
          onClose={() => setShowPremiumModal(false)}
          onSuccess={() => setIsPremium(true)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
            <Download className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Downloads</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {downloads.length} video{downloads.length !== 1 ? 's' : ''} downloaded
            </p>
          </div>
        </div>

        {!isPremium && (
          <button
            onClick={() => setShowPremiumModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm hover:opacity-90 transition shadow-lg hover:shadow-violet-500/30"
          >
            <Crown className="w-4 h-4" />
            Upgrade to Premium
          </button>
        )}

        {isPremium && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold">
            <Crown className="w-4 h-4 text-yellow-300" />
            Premium Active
          </div>
        )}
      </div>

      {/* Free plan notice */}
      {!isPremium && (
        <div className="mb-6 p-4 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-violet-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">
                Free plan: 1 download per day
              </p>
              <p className="text-xs text-violet-600 dark:text-violet-400">
                Upgrade to Premium for unlimited downloads
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPremiumModal(true)}
            className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline whitespace-nowrap"
          >
            Upgrade →
          </button>
        </div>
      )}

      {/* Downloads list */}
      {downloads.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No downloads yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Videos you download will appear here
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition"
          >
            <Play className="w-4 h-4" />
            Browse Videos
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {downloads.map((item) => (
            <div
              key={item._id}
              className="flex gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-800 transition group shadow-sm"
            >
              {/* Thumbnail */}
              <Link href={`/watch/${item.videoId}`} className="flex-shrink-0">
                <div className="relative w-40 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {item.thumbnailUrl ? (
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.videoTitle}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                    <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/watch/${item.videoId}`}>
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-violet-600 dark:hover:text-violet-400 transition text-sm">
                    {item.videoTitle}
                  </h3>
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.channelName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Downloaded {formatDate(item.downloadedAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={item.videoUrl}
                  download={item.videoTitle}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition"
                  title="Download again"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
