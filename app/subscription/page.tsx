'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { Crown, Lock, Play, Star, Zap, Shield, Loader2 } from 'lucide-react';
import PremiumModal from '@/components/premium-modal';
import { getAllVideos, Video as FirestoreVideo } from '@/lib/db/videos';

interface PremiumVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  category: string;
  views: number;
  likes: number;
  createdAt: string;
}

// Hardcoded sample premium content (shown as teaser to non-premium users)
const SAMPLE_PREMIUM = [
  {
    id: 'premium-1',
    title: 'Exclusive: Behind the Scenes - Pro Filmmaking Techniques',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=225&fit=crop',
    category: 'Film & Animation',
    views: 84200,
  },
  {
    id: 'premium-2',
    title: 'Master Class: Advanced Music Production Secrets',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=225&fit=crop',
    category: 'Music',
    views: 63000,
  },
  {
    id: 'premium-3',
    title: 'Full Course: Machine Learning & AI in 2025',
    thumbnailUrl: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=225&fit=crop',
    category: 'Science & Technology',
    views: 120500,
  },
  {
    id: 'premium-4',
    title: 'Exclusive Travel Series: Hidden Gems of Southeast Asia',
    thumbnailUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=225&fit=crop',
    category: 'Travel & Events',
    views: 45800,
  },
  {
    id: 'premium-5',
    title: 'Pro Chef Series: Restaurant-Quality Recipes at Home',
    thumbnailUrl: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400&h=225&fit=crop',
    category: 'Howto & Style',
    views: 97300,
  },
  {
    id: 'premium-6',
    title: 'Elite Fitness: 30-Day Body Transformation Program',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=225&fit=crop',
    category: 'Sports',
    views: 156000,
  },
];

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumVideos, setPremiumVideos] = useState<PremiumVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const init = async () => {
      if (user) {
        const [premRes, contentRes] = await Promise.all([
          fetch(`/api/premium/status?userId=${user.uid}`),
          fetch('/api/subscription-content?limit=20'),
        ]);
        const premData = await premRes.json();
        const contentData = await contentRes.json();
        const isPrem = premData.isPremium === true;
        setIsPremium(isPrem);
        let videos = contentData.videos || [];
        // Fallback: if premium user but no isPremiumContent videos,
        // fetch the same videos the Home page shows (Firestore + MongoDB)
        if (isPrem && videos.length === 0) {
          const [firestoreVideos, mongoRes] = await Promise.all([
            getAllVideos().catch(() => [] as FirestoreVideo[]),
            fetch('/api/uploads-list?limit=50').then(r => r.json()).catch(() => ({ uploads: [] })),
          ]);
          const mongoVideos = (mongoRes.uploads || []).filter((v: { isPremiumContent?: boolean }) => !v.isPremiumContent);
          const combined = [
            ...firestoreVideos.map(v => ({ id: v.id, title: v.title, thumbnailUrl: v.thumbnailUrl, videoUrl: v.videoUrl, category: v.category, views: v.views, likes: v.likes, createdAt: v.createdAt, description: v.description })),
            ...mongoVideos,
          ];
          videos = combined;
        }
        setPremiumVideos(videos);
      }
      setLoading(false);
    };
    init().catch(console.error);
  }, [user, authLoading]);

  const perks = [
    { icon: Crown, title: 'Exclusive Content', desc: 'Premium-only videos not on the home feed' },
    { icon: Zap, title: 'Unlimited Downloads', desc: 'Download any video, any time' },
    { icon: Shield, title: 'Ad-Free Experience', desc: 'Watch without interruptions' },
    { icon: Star, title: 'Early Access', desc: 'Watch new content before anyone else' },
  ];

  if (authLoading || loading) {
    return (
      <div className="flex-1 ml-64 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  // ── NON-PREMIUM PAYWALL ──
  if (!isPremium) {
    return (
      <div className="flex-1 ml-64 min-h-screen">
        {showModal && user && (
          <PremiumModal
            userId={user.uid}
            onClose={() => setShowModal(false)}
            onSuccess={() => { setIsPremium(true); setShowModal(false); }}
          />
        )}

        {/* Hero section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-900 via-purple-800 to-fuchsia-900 text-white px-8 py-20 text-center">
          {/* Glow orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-6">
              <Crown className="w-4 h-4 text-yellow-300" />
              Premium Members Only
            </div>
            <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
              Unlock Premium Content
            </h1>
            <p className="text-xl text-white/80 max-w-xl mx-auto mb-8">
              Get unlimited access to exclusive videos, courses, and behind-the-scenes content — all for a one-time payment.
            </p>
            <button
              onClick={() => user ? setShowModal(true) : window.location.href = '/auth'}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-violet-700 font-bold text-lg hover:scale-105 transition-transform shadow-2xl shadow-violet-900/50"
            >
              <Crown className="w-6 h-6" />
              Get Premium — ₹499 Lifetime
            </button>
            <p className="text-sm text-white/50 mt-3">One-time payment · No recurring charges</p>
          </div>
        </div>

        {/* Perks */}
        <div className="px-8 py-12 bg-gray-50 dark:bg-gray-950">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            What you get with Premium
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {perks.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white dark:bg-gray-900 rounded-2xl p-6 text-center shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Teaser — blurred premium content */}
        <div className="px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-violet-500" />
              Premium Content Preview
            </h2>
            <span className="text-sm text-gray-500">Unlock all {SAMPLE_PREMIUM.length}+ exclusive videos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative">
            {SAMPLE_PREMIUM.map((video, i) => (
              <div
                key={video.id}
                className={`relative rounded-2xl overflow-hidden cursor-pointer group ${i >= 3 ? 'opacity-60' : ''}`}
                onClick={() => user ? setShowModal(true) : window.location.href = '/auth'}
              >
                <div className="relative aspect-video bg-gray-200 dark:bg-gray-800">
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    className="object-cover blur-sm group-hover:blur-0 transition-all duration-300"
                  />
                  {/* Lock overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40">
                        <Lock className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white text-xs font-semibold bg-black/40 px-2 py-1 rounded-full">Premium Only</span>
                    </div>
                  </div>
                  {/* Crown badge */}
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full p-1">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-gray-900">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">{video.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{video.category}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{(video.views / 1000).toFixed(0)}K views</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Upgrade CTA overlay at bottom */}
            <div className="col-span-full mt-4 text-center">
              <button
                onClick={() => user ? setShowModal(true) : window.location.href = '/auth'}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:opacity-90 transition shadow-lg"
              >
                <Crown className="w-5 h-5" />
                Unlock All Premium Content
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PREMIUM USER — Full Content ──
  const allVideos = premiumVideos.length > 0 ? premiumVideos : [];

  return (
    <div className="flex-1 ml-64 p-8">
      {/* Premium header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
          <Crown className="w-6 h-6 text-yellow-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Premium Subscription
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
              ACTIVE
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Exclusive content just for premium members
          </p>
        </div>
      </div>

      {/* No content fallback */}
      {allVideos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Crown className="w-16 h-16 text-violet-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Premium Content Coming Soon</h2>
          <p className="text-gray-500 dark:text-gray-400">Exclusive videos are being added. Check back soon!</p>
        </div>
      )}

      {/* Real DB premium videos */}
      {allVideos.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            Exclusive Premium Videos ({allVideos.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allVideos.map((video) => (
              <Link key={video.id} href={`/watch/${video.id}`}>
                <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 transition shadow-sm group">
                  <div className="relative aspect-video bg-gray-200 dark:bg-gray-800">
                    {video.thumbnailUrl && (
                      <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition">
                      <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full p-1">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-violet-600 transition">
                      {video.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{video.category} · {video.views?.toLocaleString() || 0} views</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
