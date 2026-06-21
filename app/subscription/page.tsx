'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { Crown, Lock, Play, Star, Zap, Shield, Loader2, X, Check } from 'lucide-react';
import PremiumModal from '@/components/premium-modal';
import { getAllVideos, Video as FirestoreVideo } from '@/lib/db/videos';

const DEFAULT_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

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
];

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth();
  const [activePlan, setActivePlan] = useState<'free' | 'bronze' | 'silver' | 'gold'>('free');
  const [videoLimit, setVideoLimit] = useState(300);
  const [premiumVideos, setPremiumVideos] = useState<PremiumVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ title: string; videoUrl: string } | null>(null);

  const fetchStatus = async () => {
    if (!user) return;
    try {
      const [premRes, contentRes] = await Promise.all([
        fetch(`/api/premium/status?userId=${user.uid}`),
        fetch('/api/subscription-content?limit=20'),
      ]);
      const premData = await premRes.json();
      const contentData = await contentRes.json();
      
      setActivePlan(premData.plan || 'free');
      setVideoLimit(premData.videoTimeLimit || 300);

      let videos = contentData.videos || [];
      if (premData.isPremium && videos.length === 0) {
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchStatus();
  }, [user, authLoading]);

  const planInfo = {
    free: { name: 'Free Tier', limit: '5 Minutes per video', color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700' },
    bronze: { name: 'Bronze Plan', limit: '7 Minutes per video', color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900' },
    silver: { name: 'Silver Plan', limit: '10 Minutes per video', color: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
    gold: { name: 'Gold Plan', limit: 'Unlimited video access', color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900' },
  };

  const getPerksForPlan = (plan: string) => {
    switch (plan) {
      case 'gold':
        return ['Unlimited playback duration', 'Ad-free playback experience', 'Unlimited video downloads', 'Premium badge on channel page'];
      case 'silver':
        return ['10 Minutes playback duration', 'Ad-free playback experience', 'Up to 5 video downloads/day'];
      case 'bronze':
        return ['7 Minutes playback duration', 'Ad-free playback experience', '1 video download/day'];
      default:
        return ['5 Minutes playback duration', 'Ad-supported playback', 'No video downloads allowed'];
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      {showModal && user && (
        <PremiumModal
          userId={user.uid}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setLoading(true);
            fetchStatus();
          }}
        />
      )}

      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedVideo(null)}>
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
              <h3 className="text-white font-semibold text-sm truncate pr-4">{selectedVideo.title}</h3>
              <button onClick={() => setSelectedVideo(null)} className="text-gray-400 hover:text-white transition flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <video
              src={selectedVideo.videoUrl}
              controls
              autoPlay
              className="w-full aspect-video bg-black"
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
          <Crown className="w-6 h-6 text-yellow-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Subscription Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitor plan details, limits, and perform subscription upgrades
          </p>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Active Plan Detail Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Current Tier</span>
            <div className="flex items-center gap-2.5 mt-2 mb-4">
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${planInfo[activePlan].color}`}>
                {planInfo[activePlan].name}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Limit: <strong>{planInfo[activePlan].limit}</strong>
            </p>
            
            <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-2 border-b dark:border-gray-800 pb-1.5">Unlocked Perks:</h3>
            <ul className="space-y-2">
              {getPerksForPlan(activePlan).map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          {activePlan !== 'gold' && (
            <button
              onClick={() => setShowModal(true)}
              className="w-full mt-8 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white font-bold text-sm shadow-md transition"
            >
              Upgrade Plan
            </button>
          )}
        </div>

        {/* Informative Perks Guide Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-violet-900 via-purple-800 to-fuchsia-950 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <h2 className="text-3xl font-black mb-3">Seamless Upgrades</h2>
            <p className="text-sm text-white/80 max-w-lg leading-relaxed mb-6">
              Need more watching duration? Instantly upgrade your tier for pocket-friendly, one-time pricing via Razorpay. A billing confirmation receipt and invoice will be emailed to you immediately after successful payment.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Bronze</span>
              <p className="text-base font-bold">₹10 <span className="text-[10px] text-white/60">/ 7 min</span></p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Silver</span>
              <p className="text-base font-bold">₹50 <span className="text-[10px] text-white/60">/ 10 min</span></p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Gold</span>
              <p className="text-base font-bold">₹100 <span className="text-[10px] text-white/60">/ Unlim</span></p>
            </div>
          </div>
        </div>

      </div>

      {/* Videos Section */}
      <div className="border-t dark:border-gray-800 pt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          Exclusive Premium Videos Preview
        </h2>

        {/* Hardcoded Sample Teaser Videos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLE_PREMIUM.map((video) => (
            <div
              key={video.id}
              className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 transition shadow-sm group cursor-pointer"
              onClick={() => setSelectedVideo({ title: video.title, videoUrl: DEFAULT_VIDEO_URL })}
            >
              <div className="relative aspect-video bg-gray-200 dark:bg-gray-800">
                <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" />
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
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-500">{video.category}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">{(video.views / 1000).toFixed(0)}K views</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
