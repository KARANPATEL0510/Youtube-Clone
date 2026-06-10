"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Video, 
  PlaySquare, 
  Users, 
  Home, 
  Heart, 
  Clock, 
  ThumbsUp,
  ListVideo,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  count?: number;
}

interface ChannelTabProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  showCounts?: boolean;
  variant?: "default" | "underline" | "pill" | "minimal";
  className?: string;
  tabs?: TabItem[];
}

const defaultTabs: TabItem[] = [
  { id: "videos", label: "Videos", icon: Video },
  { id: "playlists", label: "Playlists", icon: ListVideo },
  { id: "community", label: "Community", icon: Users },
  { id: "channels", label: "Channels", icon: Users },
  { id: "about", label: "About", icon: Home },
];

const ChannelTab = ({ 
  activeTab: externalActiveTab, 
  onTabChange,
  showCounts = false,
  variant = "underline",
  className = "",
  tabs = defaultTabs
}: ChannelTabProps) => {
  const [activeTab, setActiveTab] = useState(externalActiveTab || "videos");
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Sample counts for tabs
  const tabCounts: Record<string, number> = {
    videos: 128,
    playlists: 12,
    community: 45,
    channels: 8,
    about: 0,
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  // Update underline indicator position
  useEffect(() => {
    if (variant === "underline") {
      const activeTabElement = tabRefs.current[activeTab];
      if (activeTabElement && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const tabRect = activeTabElement.getBoundingClientRect();
        setIndicatorStyle({
          left: tabRect.left - containerRect.left,
          width: tabRect.width,
        });
      }
    }
  }, [activeTab, variant]);

  // Handle scroll for horizontal scrollable tabs
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const scrollAmount = 200;
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      handleScroll();
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Pill variant
  if (variant === "pill") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = showCounts ? tabCounts[tab.id] : undefined;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-black dark:bg-white text-white dark:text-black shadow-md"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {count !== undefined && count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                    : "bg-gray-300 dark:bg-gray-700"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Minimal variant
  if (variant === "minimal") {
    return (
      <div className={`flex gap-6 border-b border-gray-200 dark:border-gray-800 ${className}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-2 px-1 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                isActive
                  ? "border-black dark:border-white text-black dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default underline variant with scroll
  return (
    <div className={`relative ${className}`}>
      {/* Left Scroll Arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white dark:bg-black rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Tabs Container */}
      <div
        ref={containerRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide relative border-b border-gray-200 dark:border-gray-800"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = showCounts ? tabCounts[tab.id] : undefined;
          
          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[tab.id] = el; }}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-2 px-2 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "text-black dark:text-white"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {count !== undefined && count > 0 && (
                <span className="text-xs text-gray-400">({count})</span>
              )}
            </button>
          );
        })}
        
        {/* Animated Underline Indicator */}
        {variant === "underline" && (
          <div
            className="absolute bottom-0 h-0.5 bg-black dark:bg-white transition-all duration-300 ease-out"
            style={indicatorStyle}
          />
        )}
      </div>

      {/* Right Scroll Arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white dark:bg-black rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Gradient Shadows for edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-black to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black to-transparent pointer-events-none" />
    </div>
  );
};

// Sub-component: Tab Panel Content
interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
}

export const TabPanel = ({ id, activeTab, children }: TabPanelProps) => {
  if (activeTab !== id) return null;
  return <div className="tab-panel">{children}</div>;
};

// Sub-component: Custom Tab Item for advanced usage
interface CustomTabItemProps {
  icon?: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
  badge?: string;
}

export const CustomTabItem = ({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick, 
  count,
  badge 
}: CustomTabItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-black dark:bg-white text-white dark:text-black shadow-md"
          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/20">
          {count}
        </span>
      )}
      {badge && (
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white">
          {badge}
        </span>
      )}
    </button>
  );
};

export default ChannelTab;