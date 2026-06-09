"use client";

import { useState } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  thumbnail?: string;
}

const VideoPlayer = ({ videoUrl, title = "Video Player" }: VideoPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-white/60 text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
          <div className="text-center">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* HTML5 Video Player */}
      <video
        className="w-full h-full"
        controls
        controlsList="nodownload"
        onLoadedData={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError('Failed to load video. Please check the video URL.');
        }}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;