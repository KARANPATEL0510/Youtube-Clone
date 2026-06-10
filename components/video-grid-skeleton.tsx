import VideoSkeleton from "./video-skeleton";

const VideoGridSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array(12)
        .fill(0)
        .map((_, index) => (
          <VideoSkeleton key={index} />
        ))}
    </div>
  );
};

export default VideoGridSkeleton;