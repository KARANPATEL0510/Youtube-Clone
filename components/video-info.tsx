"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Download, 
  MoreHorizontal,
  Bell,
  Check,
  X
} from "lucide-react";

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
  };
}

const VideoInfo = ({ video }: VideoInfoProps) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(parseInt(video.likes));
  const [dislikeCount, setDislikeCount] = useState(parseInt(video.dislikes));
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showNotification, setShowNotification] = useState<{message: string; type: string} | null>(null);

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

  const handleDownload = (quality: string) => {
    setShowDownloadMenu(false);
    showTempNotification(`Downloading ${quality}... (Demo)`, "info");
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

          {/* Download Button */}
          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            
            {showDownloadMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDownloadMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  <button onClick={() => handleDownload("1080p")} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition">1080p (HD)</button>
                  <button onClick={() => handleDownload("720p")} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition">720p (HD)</button>
                  <button onClick={() => handleDownload("480p")} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition">480p (SD)</button>
                </div>
              </>
            )}
          </div>

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