"use client";

import { useEffect, useState } from "react";
import VideoCard from "./video-card";
import VideoGridSkeleton from "./video-grid-skeleton";
import { Video } from "@/lib/db/videos";

// Sample / fallback video data shaped to match the Video type
const fetchVideos = async (): Promise<Video[]> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return Array(12)
    .fill(0)
    .map((_, i) => ({
      id: String(i + 1),
      title: `Video Title ${i + 1}`,
      description: "",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400",
      videoUrl: "",
      authorId: "sample",
      authorName: "Channel Name",
      authorPhotoUrl: "https://github.com/shadcn.png",
      views: 1_000_000,
      likes: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      category: "General",
    }));
};

const VideoGrid = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos().then((data) => {
      setVideos(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <VideoGridSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
};

export default VideoGrid;