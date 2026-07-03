"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  MoreHorizontal,
  Bell,
  Check,
  X,
  Loader2,
  Crown,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import PremiumModal from "@/components/premium-modal";

interface VideoInfoProps {
  video: {
    id: string;
    title: string;
    channel: string;
    channelAvatar: string;
    subscribers: string;
    views: string;
    timestamp: string;
    description: string;
    likes: string;
    dislikes: string;
    // Download-related (optional — for wiring to /api/downloads)
    videoUrl?: string;
    thumbnailUrl?: string;
    authorId?: string;
  };
}

const VideoInfo = ({ video }: VideoInfoProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(parseInt(video.likes));
  const [dislikeCount, setDislikeCount] = useState(parseInt(video.dislikes));
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showNotification, setShowNotification] = useState<{message: string; type: string} | null>(null);

  // Download state
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadLimitReached, setDownloadLimitReached] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const showTempNotification = (message: string, type: string = "success") => {
    setShowNotification({ message, type });
    setTimeout(() => {
      setShowNotification(null);
    }, 3000);
  };

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
    if (!isSubscribed) {
      showTempNotification(`Subscribed to ${video.channel}`, "success");
    } else {
      showTempNotification(`Unsubscribed from ${video.channel}`, "info");
    }
  };

  const handleLike = () => {
    if (liked) {
      setLikeCount(likeCount - 1);
      setLiked(false);
      showTempNotification("Removed like", "info");
    } else {
      setLikeCount(likeCount + 1);
      setLiked(true);
      if (disliked) {
        setDislikeCount(dislikeCount - 1);
        setDisliked(false);
      }
      showTempNotification("Liked video", "success");
    }
  };

  const handleDislike = () => {
    if (disliked) {
      setDislikeCount(dislikeCount - 1);
      setDisliked(false);
      showTempNotification("Removed dislike", "info");
    } else {
      setDislikeCount(dislikeCount + 1);
      setDisliked(true);
      if (liked) {
        setLikeCount(likeCount - 1);
        setLiked(false);
      }
      showTempNotification("Disliked video", "info");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowShareMenu(false);
      showTempNotification("Link copied to clipboard!", "success");
    } catch (err) {
      showTempNotification("Failed to copy link", "error");
    }
  };

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
      "_blank",
      "width=600,height=400"
    );
    setShowShareMenu(false);
  };

  const handleShareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(video.title)}`,
      "_blank",
      "width=600,height=400"
    );
    setShowShareMenu(false);
  };

  const handleDownload = async () => {
    // Must be signed in
    if (!user) {
      router.push("/auth");
      showTempNotification("Please sign in to download videos", "error");
      return;
    }
    // Need a videoUrl to download
    if (!video.videoUrl) {
      showTempNotification("No downloadable file available for this video", "error");
      return;
    }

    setDownloadLoading(true);
    setDownloadLimitReached(false);
    setDownloadError(null);
    setShowDownloadMenu(false);

    try {
      // POST to /api/downloads — checks daily limit + premium status
      const res = await fetch("/api/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          videoId: video.id,
          videoTitle: video.title,
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl || "",
          channelName: video.channel,
        }),
      });

      const data = await res.json();

      // Free user hit daily limit → open Premium modal
      if (res.status === 429 && data.error === "daily_limit_reached") {
        setDownloadLimitReached(true);
        setShowPremiumModal(true);
        showTempNotification(
          "Daily download limit reached. Upgrade to Premium for unlimited downloads!",
          "error"
        );
        return;
      }

      if (!res.ok) throw new Error(data.error || "Download failed");

      // Trigger real browser file download
      const a = document.createElement("a");
      a.href = video.videoUrl!;
      a.download = video.title || "video";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
      showTempNotification("Download started! Saved to Downloads section.", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Download failed";
      setDownloadError(msg);
      showTempNotification(msg, "error");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleSaveToWatchLater = () => {
    setShowMoreMenu(false);
    showTempNotification("Saved to Watch Later", "success");
  };

  const handleSaveToPlaylist = () => {
    setShowMoreMenu(false);
    showTempNotification("Choose a playlist to save to", "info");
  };

  const handleReport = () => {
    setShowMoreMenu(false);
    showTempNotification("Thanks for reporting. We'll review it.", "info");
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <div className="mt-4">
      {/* Premium Modal — shown when daily limit is reached */}
      {showPremiumModal && user && (
        <PremiumModal
          userId={user.uid}
          onClose={() => { setShowPremiumModal(false); setDownloadLimitReached(false); }}
          onSuccess={() => { setIsPremium(true); setDownloadLimitReached(false); }}
        />
      )}

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
            showNotification.type === "success" 
              ? "bg-green-500 text-white" 
              : showNotification.type === "error"
              ? "bg-red-500 text-white"
              : "bg-blue-500 text-white"
          }`}>
            {showNotification.type === "success" && <Check className="w-4 h-4" />}
            {showNotification.type === "error" && <X className="w-4 h-4" />}
            {showNotification.type === "info" && <Bell className="w-4 h-4" />}
            {showNotification.message}
          </div>
        </div>
      )}

      {/* Video Title */}
      <h1 className="text-xl md:text-2xl font-bold">{video.title}</h1>
      
      {/* Channel Info & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
        {/* Channel Section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Image
              src={video.channelAvatar}
              alt={video.channel}
              width={48}
              height={48}
              className="rounded-full object-cover"
              style={{ width: "48px", height: "48px" }}
            />
            <div>
              <h3 className="font-semibold hover:underline cursor-pointer text-base">
                {video.channel}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {video.subscribers}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSubscribe}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition flex items-center gap-1 ${
              isSubscribed
                ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            }`}
          >
            {isSubscribed ? (
              <>
                <Check className="w-4 h-4" />
                Subscribed
              </>
            ) : (
              <>
                Subscribe
                <Bell className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition ${
              liked
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <ThumbsUp className="w-5 h-5" />
            <span>{formatNumber(likeCount)}</span>
          </button>

          <button
            onClick={handleDislike}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition ${
              disliked
                ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <ThumbsDown className="w-5 h-5" />
            <span>{formatNumber(dislikeCount)}</span>
          </button>

          {/* Share Button */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <Share2 className="w-5 h-5" />
              <span className="hidden sm:inline">Share</span>
            </button>
            
            {showShareMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  <button onClick={handleCopyLink} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition">
                    📋 Copy link
                  </button>
                  <button onClick={handleShareFacebook} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    📘 Share to Facebook
                  </button>
                  <button onClick={handleShareTwitter} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition">
                    🐦 Share to Twitter
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Download Button — wired to /api/downloads */}
          <button
            onClick={handleDownload}
            disabled={downloadLoading}
            title={
              !user
                ? "Sign in to download"
                : downloadLimitReached
                ? "Daily limit reached — upgrade to Premium"
                : isPremium
                ? "Download video (Premium — unlimited)"
                : "Download video (Free: 1 per day)"
            }
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition disabled:opacity-60 font-medium ${
              downloadSuccess
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                : downloadLimitReached
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                : downloadError
                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {downloadLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : downloadSuccess ? (
              <Check className="w-5 h-5" />
            ) : downloadLimitReached ? (
              <Crown className="w-5 h-5" />
            ) : downloadError ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">
              {downloadLoading
                ? "Downloading…"
                : downloadSuccess
                ? "Saved!"
                : downloadLimitReached
                ? "Go Premium"
                : downloadError
                ? "Retry"
                : "Download"}
            </span>
          </button>

          {/* More Options */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMoreMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  <button onClick={handleSaveToWatchLater} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition">⏰ Save to Watch Later</button>
                  <button onClick={handleSaveToPlaylist} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition">📁 Save to Playlist</button>
                  <button onClick={handleReport} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition">🚫 Report</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
        <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>{video.views}</span>
          <span>•</span>
          <span>{video.timestamp}</span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{video.description}</p>
      </div>
    </div>
  );
};

export default VideoInfo;