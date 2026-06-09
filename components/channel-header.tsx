"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Bell, 
  Check, 
  Share2, 
  MoreHorizontal,
  Settings,
  UserPlus,
  MessageCircle,
  Flag,
  Copy,
  Link as LinkIcon
} from "lucide-react";

interface ChannelHeaderProps {
  channel: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    banner: string;
    subscribers: string;
    joinedDate: string;
    totalViews: string;
    videosCount: number;
    description?: string;
    verified?: boolean;
  };
  isOwnChannel?: boolean;
  onSubscribe?: () => void;
}

const ChannelHeader = ({ 
  channel, 
  isOwnChannel = false, 
  onSubscribe 
}: ChannelHeaderProps) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [notificationType, setNotificationType] = useState<"all" | "personalized" | "none">("all");

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
    if (onSubscribe) onSubscribe();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareMenu(false);
  };

  const handleShareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=Check out ${channel.name} on YourTube!`,
      "_blank",
      "width=600,height=400"
    );
    setShowShareMenu(false);
  };

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
      "_blank",
      "width=600,height=400"
    );
    setShowShareMenu(false);
  };

  const handleReport = () => {
    setShowMoreMenu(false);
    alert("Report submitted. Thank you for your feedback.");
  };

  const handleMessage = () => {
    setShowMoreMenu(false);
  };

  return (
    <div className="relative">
      {/* Banner - Added loading="eager" and priority for LCP optimization */}
      <div className="relative w-full h-48 md:h-56 lg:h-64 overflow-hidden bg-gradient-to-r from-gray-900 to-gray-700">
        {channel.banner ? (
          <Image
            src={channel.banner}
            alt={`${channel.name} banner`}
            fill
            className="object-cover"
            loading="eager"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/20 text-4xl font-bold">YourTube</span>
          </div>
        )}
        
        {/* Edit Banner Button (for own channel) */}
        {isOwnChannel && (
          <button className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white text-sm px-3 py-1.5 rounded-full backdrop-blur-sm transition">
            Edit banner
          </button>
        )}
      </div>

      {/* Channel Info - Overlapping Banner */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end -mt-12 md:-mt-16 mb-6">
          {/* Avatar */}
          <div className="relative group">
            <Image
              src={channel.avatar}
              alt={channel.name}
              width={128}
              height={128}
              className="rounded-full border-4 border-white dark:border-black bg-white dark:bg-black"
              style={{ width: "128px", height: "128px" }}
              priority
            />
            {isOwnChannel && (
              <button className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100">
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Channel Name & Actions */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  {channel.name}
                  {channel.verified && (
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-gray-600 dark:text-gray-400">
                    {channel.handle}
                  </p>
                  <span className="text-gray-400">•</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {channel.subscribers} subscribers
                  </p>
                  <span className="text-gray-400">•</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {channel.videosCount} videos
                  </p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {!isOwnChannel ? (
                  <>
                    <button
                      onClick={handleSubscribe}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 ${
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
                        "Subscribe"
                      )}
                    </button>
                    
                    {isSubscribed && (
                      <div className="relative">
                        <button
                          onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                          className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                        >
                          <Bell className="w-5 h-5" />
                        </button>
                        
                        {showNotificationMenu && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setShowNotificationMenu(false)} 
                            />
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2 z-20">
                              <button
                                onClick={() => {
                                  setNotificationType("all");
                                  setShowNotificationMenu(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded transition ${
                                  notificationType === "all"
                                    ? "bg-gray-100 dark:bg-gray-700 font-semibold"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                              >
                                All notifications
                              </button>
                              <button
                                onClick={() => {
                                  setNotificationType("personalized");
                                  setShowNotificationMenu(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded transition ${
                                  notificationType === "personalized"
                                    ? "bg-gray-100 dark:bg-gray-700 font-semibold"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                              >
                                Personalized notifications
                              </button>
                              <button
                                onClick={() => {
                                  setNotificationType("none");
                                  setShowNotificationMenu(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded transition ${
                                  notificationType === "none"
                                    ? "bg-gray-100 dark:bg-gray-700 font-semibold"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                              >
                                None
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <button className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Customize channel
                  </button>
                )}
                
                {/* Share Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  
                  {showShareMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowShareMenu(false)} 
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-1 z-20">
                        <button
                          onClick={handleCopyLink}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy link
                        </button>
                        <button
                          onClick={handleShareTwitter}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                        >
                          <span className="text-blue-400">🐦</span>
                          Share to Twitter
                        </button>
                        <button
                          onClick={handleShareFacebook}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                        >
                          <span className="text-blue-600">📘</span>
                          Share to Facebook
                        </button>
                      </div>
                    </>
                  )}
                </div>
                
                {/* More Options Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  
                  {showMoreMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowMoreMenu(false)} 
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-1 z-20">
                        {!isOwnChannel ? (
                          <>
                            <button
                              onClick={handleMessage}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Send message
                            </button>
                            <button
                              onClick={handleReport}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                            >
                              <Flag className="w-4 h-4" />
                              Report user
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2">
                              <Settings className="w-4 h-4" />
                              Channel settings
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2">
                              <UserPlus className="w-4 h-4" />
                              Invite collaborators
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Channel Stats Row */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-black dark:text-white">
                  {channel.totalViews}
                </span>
                <span>total views</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-black dark:text-white">
                  {channel.subscribers}
                </span>
                <span>subscribers</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-black dark:text-white">
                  Joined {channel.joinedDate}
                </span>
              </div>
            </div>
            
            {/* Short Description */}
            {channel.description && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {channel.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelHeader;