"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Compass, 
  Users, 
  History, 
  ThumbsUp, 
  Clock, 
  User,
  PlaySquare,
  PlusSquare,
  Download,
  Video
} from "lucide-react";

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Explore", icon: Compass, path: "/explore" },
    { name: "Subscription", icon: Users, path: "/subscription" },
    { name: "Friends & Calls", icon: Video, path: "/friends" },
    { name: "History", icon: History, path: "/history" },
    { name: "Liked videos", icon: ThumbsUp, path: "/liked" },
    { name: "Watch later", icon: Clock, path: "/watch-later" },
    { name: "Downloads", icon: Download, path: "/downloads" },
    { name: "Your channel", icon: User, path: "/channel-dashboard" },
    { name: "Your videos", icon: PlaySquare, path: "/your-videos" },
    { name: "Create Channel", icon: PlusSquare, path: "/create-channel" },
  ];

  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-16 md:w-64 flex-shrink-0 overflow-y-auto bg-white border-r dark:bg-black dark:border-gray-800 transition-all duration-300 z-40">
      <div className="py-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`w-full flex flex-col md:flex-row items-center gap-1 md:gap-4 px-1 md:px-4 py-3 md:py-2 transition-colors ${
                isActive 
                  ? "bg-gray-100 dark:bg-gray-800 text-black-600 animate-pulse-subtle" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-black-600" : ""}`} />
              <span className={`text-[10px] md:text-sm truncate w-full text-center md:text-left ${isActive ? "font-semibold text-black dark:text-white" : "text-gray-650 dark:text-zinc-400"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;