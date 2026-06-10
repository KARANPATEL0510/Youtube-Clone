'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Share2, MoreVertical, Trash2, ThumbsUp, Check, Download, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { getVideo, getVideosByCategory, Video } from '@/lib/db/videos';
import { likeVideo, unlikeVideo, addToHistory } from '@/lib/db/interactions';
import Comments from '@/components/comments';
import PremiumModal from '@/components/premium-modal';

/** MongoDB ObjectIds are 24-char hex strings */
const isMongoId = (id: string) => /^[a-f0-9]{24}$/i.test(id);

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params.id as string;
  const { user } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  // Share toast
  const [copied, setCopied] = useState(false);
  // Download
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isVideoBlocked, setIsVideoBlocked] = useState(false);

  const getVideoMimeType = (url: string): string => {
    if (url.includes('.mov') || url.includes('MOV')) return 'video/quicktime';
    if (url.includes('.mp4') || url.includes('MP4')) return 'video/mp4';
    if (url.includes('.webm') || url.includes('WEBM')) return 'video/webm';
    if (url.includes('.mkv') || url.includes('MKV')) return 'video/x-matroska';
    if (url.includes('.avi') || url.includes('AVI')) return 'video/x-msvideo';
    return 'video/mp4';
  };

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        let videoData = await getVideo(videoId);

        // If not found in Firestore, try MongoDB
        if (!videoData) {
          const res = await fetch(`/api/uploads?id=${videoId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.upload) {
              videoData = {
                id: data.upload._id || videoId,
                title: data.upload.title,
                description: data.upload.description,
                thumbnailUrl: data.upload.thumbnailUrl,
                videoUrl: data.upload.videoUrl,
                authorId: data.upload.userId,
                authorName: data.upload.channelName || 'Unknown',
                authorPhotoUrl: data.upload.profileImage,
                views: data.upload.views,
                likes: data.upload.likes,
                createdAt: new Date(data.upload.createdAt).getTime(),
                updatedAt: new Date(data.upload.updatedAt).getTime(),
                category: data.upload.category,
              };
              // Check if premium content — gate immediately if user not premium
              if (data.upload.isPremiumContent) {
                const premRes = await fetch(`/api/premium/status?userId=${user?.uid || 'anon'}`);
                const premData = await premRes.json();
                if (!premData.isPremium) {
                  setIsVideoBlocked(true);
                }
              }
            }
          }
        }

        if (!videoData) {
          setError('Video not found');
          setLoading(false);
          return;
        }

        setVideo(videoData);
        setLikeCount(videoData.likes || 0);

        if (videoData.videoUrl && videoData.videoUrl.includes('.mov') && !videoData.videoUrl.startsWith('/api/files/')) {
          setVideoError('This video is in MOV format which is not supported by web browsers. Please re-upload.');
        }

        // Add to history if user is logged in (deduped per session so refresh doesn't double-count)
        if (user) {
          const sessionKey = `viewed_${user.uid}_${videoId}`;
          if (!sessionStorage.getItem(sessionKey)) {
            await addToHistory(user.uid, videoId);
            sessionStorage.setItem(sessionKey, '1');
          }
        }

        // Restore like state for MongoDB videos from localStorage
        if (isMongoId(videoId) && user) {
          const likedKey = `liked_${user.uid}_${videoId}`;
          setIsLiked(localStorage.getItem(likedKey) === '1');
        }

        // Fetch related videos by category
        if (videoData.category) {
          const related = await getVideosByCategory(videoData.category);
          setRelatedVideos(related.filter((v) => v.id !== videoId));
        }
      } catch (err) {
        setError('Failed to load video');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) fetchVideoData();
  }, [videoId, user]);

  // Fetch premium status when user changes
  useEffect(() => {
    if (!user) { setIsPremium(false); return; }
    fetch(`/api/premium/status?userId=${user.uid}`)
      .then(r => r.json())
      .then(d => setIsPremium(d.isPremium === true))
      .catch(() => { });
  }, [user]);

  const handleDownload = async () => {
    if (!user) { alert('Please sign in to download videos'); return; }
    if (!video) return;
    setDownloadLoading(true);
    try {
      const res = await fetch('/api/downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          videoId: video.id,
          videoTitle: video.title,
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          channelName: video.authorName,
        }),
      });
      const data = await res.json();
      if (res.status === 429 && data.error === 'daily_limit_reached') {
        setShowPremiumModal(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed');
      // Trigger browser download
      const a = document.createElement('a');
      a.href = video.videoUrl;
      a.download = video.title || 'video';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('Please sign in to like videos');
      return;
    }
    if (likeLoading) return;
    setLikeLoading(true);

    try {
      if (isMongoId(videoId)) {
        const likedKey = `liked_${user.uid}_${videoId}`;
        if (isLiked) {
          const res = await fetch(`/api/uploads/${videoId}/like`, { method: 'DELETE' });
          if (res.ok) { setIsLiked(false); setLikeCount(c => Math.max(0, c - 1)); localStorage.removeItem(likedKey); }
        } else {
          const res = await fetch(`/api/uploads/${videoId}/like`, { method: 'POST' });
          if (res.ok) { setIsLiked(true); setLikeCount(c => c + 1); localStorage.setItem(likedKey, '1'); }
        }
      } else {
        if (isLiked) {
          await unlikeVideo(user.uid, videoId);
          setIsLiked(false);
          setLikeCount(c => Math.max(0, c - 1));
        } else {
          await likeVideo(user.uid, videoId);
          setIsLiked(true);
          setLikeCount(c => c + 1);
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: video?.title || 'Video', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // fallback
      await navigator.clipboard.writeText(url).catch(() => { });
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [video?.title]);

  const handleDelete = async () => {
    if (!user) { alert('Please log in to delete videos'); return; }
    if (user.uid !== video?.authorId) { alert('You can only delete your own videos'); return; }
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/uploads/${video?.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete video');
      }
      alert('Video deleted successfully');
      router.push('/your-videos');
    } catch (error) {
      console.error('Error deleting video:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete video');
    }
  };

  if (loading) {
    return <div className="p-8">Loading video...</div>;
  }

  if (!video) {
    // Premium sample IDs → redirect to subscription page
    if (typeof videoId === 'string' && /^premium-\d+$/.test(videoId)) {
      router.replace('/subscription');
      return null;
    }
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
        <div className="text-6xl mb-4">🎬</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Video not found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          This video may have been removed or the link is incorrect.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // Premium video gate — non-premium users see upgrade wall
  if (isVideoBlocked) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh] p-8">
        {showPremiumModal && user && (
          <PremiumModal
            userId={user.uid}
            onClose={() => setShowPremiumModal(false)}
            onSuccess={() => { setIsPremium(true); setIsVideoBlocked(false); }}
          />
        )}
        <div className="max-w-lg w-full text-center">
          {/* Blurred thumbnail preview */}
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-8 shadow-2xl">
            {video.thumbnailUrl && (
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                fill
                className="object-cover blur-md scale-105"
              />
            )}
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-lg">Premium Content</p>
                <p className="text-white/70 text-sm">Upgrade to watch this video</p>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{video.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            This is an exclusive premium video. Upgrade to get unlimited access to all premium content.
          </p>

          <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-6 mb-6">
            <div className="flex items-baseline justify-center gap-1 mb-4">
              <span className="text-gray-500">₹</span>
              <span className="text-4xl font-extrabold text-gray-900 dark:text-white">499</span>
              <span className="text-gray-500">/lifetime</span>
            </div>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 mb-6 text-left max-w-xs mx-auto">
              <li className="flex items-center gap-2">✅ Unlimited premium video access</li>
              <li className="flex items-center gap-2">✅ Unlimited downloads</li>
              <li className="flex items-center gap-2">✅ Ad-free experience</li>
              <li className="flex items-center gap-2">✅ Early access to new content</li>
            </ul>
            <button
              onClick={() => user ? setShowPremiumModal(true) : router.push('/auth')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              Upgrade to Premium
            </button>
          </div>

          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
            ← Go back
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="flex gap-8 max-w-7xl mx-auto p-4">
      {showPremiumModal && user && (
        <PremiumModal
          userId={user.uid}
          onClose={() => setShowPremiumModal(false)}
          onSuccess={() => setIsPremium(true)}
        />
      )}
      {/* ── Main Column ── */}
      <div className="flex-1 min-w-0">
        {/* Video Player */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
          {videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="text-center text-white max-w-md">
                <p className="text-lg font-semibold mb-2">🎬 Video Format Not Supported</p>
                <p className="text-sm text-gray-300 mb-3">{videoError}</p>
                <p className="text-xs text-gray-400 mb-4">
                  Browsers only support:<br />
                  <span className="text-green-400 font-semibold">✓ MP4, WebM, Ogg</span><br />
                  <span className="text-red-400">✗ MOV (Apple QuickTime)</span>
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Free conversion tools:<br />
                  • <a href="https://handbrake.fr/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">HandBrake</a> (Desktop)<br />
                  • <a href="https://cloudconvert.com/mov-to-mp4" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">CloudConvert</a> (Online)
                </p>
                <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs">
                  Or download original file
                </a>
              </div>
            </div>
          )}
          <video
            key={video.id}
            controls
            controlsList="nodownload"
            style={{ maxHeight: '500px', width: '100%' }}
            onCanPlay={() => setVideoError(null)}
            onLoadedMetadata={() => setVideoError(null)}
            onError={(e) => {
              const vid = e.currentTarget;
              const errorCode = vid.error?.code;
              const errorMsg =
                errorCode === 4 ? 'Video format not supported by your browser' :
                  errorCode === 3 ? 'Video loading was aborted' :
                    errorCode === 2 ? 'Network error while loading video' :
                      errorCode === 1 ? 'Video loading was aborted by user' :
                        'Unknown video error';
              setVideoError(errorMsg);
            }}
            onLoadedData={() => setVideoError(null)}
            className="w-full h-full"
          >
            <source src={video.videoUrl} type={getVideoMimeType(video.videoUrl)} />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-2">{video.title}</h1>

        {/* Channel + Actions row */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <Link href={`/channel/${video.authorId}`}>
            <div className="flex items-center gap-3">
              <Image
                src={video.authorPhotoUrl || 'https://randomuser.me/api/portraits/men/1.jpg'}
                alt={video.authorName}
                width={48}
                height={48}
                className="rounded-full"
              />
              <div>
                <p className="font-semibold">{video.authorName}</p>
                <p className="text-sm text-gray-600">Channel</p>
              </div>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition disabled:opacity-60 ${isLiked
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300'
                }`}
            >
              {likeLoading ? (
                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              )}
              <span>{isLiked ? 'Liked' : 'Like'}{likeCount > 0 ? ` · ${likeCount}` : ''}</span>
            </button>

            {/* Share button with toast */}
            <div className="relative">
              <button
                onClick={handleShare}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${copied
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300'
                  }`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                {copied ? 'Copied!' : 'Share'}
              </button>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloadLoading}
              title={isPremium ? 'Download video (Premium)' : 'Download video (1/day free)'}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition disabled:opacity-60 ${downloadSuccess
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300'
                }`}
            >
              {downloadLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : downloadSuccess ? (
                <Check className="w-5 h-5" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {downloadSuccess ? 'Saved!' : 'Download'}
            </button>

            <button className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 transition">
              <MoreVertical className="w-5 h-5" />
            </button>

            {user && user.uid === video.authorId && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                title="Delete this video"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-gray-600 mb-4 pb-4 border-b dark:border-gray-700">
          <span>{video.views?.toLocaleString() || 0} views</span>
          <span>
            {new Date(video.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Description */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
            {video.description || 'No description provided.'}
          </p>
        </div>

        {/* ── Comments Section ── */}
        <div className="border-t dark:border-gray-700 pt-2">
          <Comments videoId={videoId} />
        </div>
      </div>

      {/* ── Related Videos Sidebar ── */}
      <div className="w-80 flex-shrink-0 hidden lg:block">
        <h2 className="text-lg font-bold mb-4">Related Videos</h2>
        <div className="space-y-4">
          {relatedVideos.slice(0, 8).map((relatedVideo) => (
            <Link key={relatedVideo.id} href={`/watch/${relatedVideo.id}`}>
              <div className="flex gap-3 hover:opacity-80 transition mb-4">
                <div className="relative w-32 h-24 bg-gray-100 dark:bg-gray-800 rounded flex-shrink-0">
                  <Image
                    src={relatedVideo.thumbnailUrl}
                    alt={relatedVideo.title}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold line-clamp-2 text-sm">{relatedVideo.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{relatedVideo.authorName}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{relatedVideo.views?.toLocaleString() || 0} views</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}