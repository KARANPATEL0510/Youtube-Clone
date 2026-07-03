"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/lib/contexts/sidebar-context";
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
  Video,
  X,
} from "lucide-react";

const menuItems = [
  { name: "Home",           icon: Home,        path: "/" },
  { name: "Explore",        icon: Compass,     path: "/explore" },
  { name: "Subscription",   icon: Users,       path: "/subscription" },
  { name: "Video Call",     icon: Video,       path: "/video-call" },
  { name: "History",        icon: History,     path: "/history" },
  { name: "Liked videos",   icon: ThumbsUp,    path: "/liked" },
  { name: "Watch later",    icon: Clock,       path: "/watch-later" },
  { name: "Downloads",      icon: Download,    path: "/downloads" },
  { name: "Your channel",   icon: User,        path: "/channel-dashboard" },
  { name: "Your videos",    icon: PlaySquare,  path: "/your-videos" },
  { name: "Create Channel", icon: PlusSquare,  path: "/create-channel" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* ── Mobile overlay backdrop ───────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ─────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-14 left-0 h-[calc(100vh-3.5rem)] z-50
          w-64 flex-shrink-0 overflow-y-auto
          bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}
      >
        {/* Close button — mobile only */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="font-semibold text-sm dark:text-white">Menu</span>
          <button
            onClick={close}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="py-2">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.path ||
              (item.path !== "/" && pathname.startsWith(item.path + "/"));

            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={close}           /* close sidebar on navigation */
                className={`
                  flex items-center gap-4 px-5 py-2.5 transition-colors text-sm
                  ${isActive
                    ? "bg-gray-100 dark:bg-gray-800 font-semibold"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-zinc-400"
                  }
                `}
              >
                <item.icon
                  className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-red-600" : ""}`}
                />
                <span className={isActive ? "text-black dark:text-white" : ""}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}