const VideoSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Thumbnail Skeleton */}
      <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg mb-2"></div>
      
      {/* Content Skeleton */}
      <div className="flex gap-2">
        {/* Avatar Skeleton */}
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-full flex-shrink-0"></div>
        
        {/* Text Skeletons */}
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
        </div>
      </div>
    </div>
  );
};

export default VideoSkeleton;