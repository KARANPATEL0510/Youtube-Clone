"use client";

import { useState, useEffect, Suspense } from "react";
import { Menu, Search, Mic, Bell, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/contexts/auth-context";
import { logoutUser } from "@/lib/db/auth";
import { useRouter, useSearchParams } from "next/navigation";

function HeaderInner() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  // Keep the input in sync when the URL query changes (e.g. back/forward)
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-white border-b dark:bg-black dark:border-gray-800">
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
          <Menu className="w-6 h-6" />
        </button>
        <Link href="/" className="flex items-center gap-1">
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-red-600">You</span>
            <span className="text-black dark:text-white">Tube</span>
          </span>
        </Link>
      </div>

      {/* Search bar */}
      <div className="flex-1 max-w-2xl mx-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="header-search-input"
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-2 border border-gray-300 rounded-l-full focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
            />
            <button
              id="header-search-btn"
              onClick={handleSearch}
              className="absolute right-0 top-0 h-full px-5 bg-gray-100 border border-l-0 border-gray-300 rounded-r-full hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 transition"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 dark:bg-gray-800 transition">
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-gray-100 rounded-full transition">
          <Bell className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        ) : user ? (
          <div className="flex items-center gap-3">
            <Link href="/channel/[id]" as={`/channel/${user.uid}`}>
              <Image
                src={userProfile?.photoURL || "https://randomuser.me/api/portraits/men/4.jpg"}
                alt="User avatar"
                width={32}
                height={32}
                className="rounded-full object-cover cursor-pointer hover:opacity-80"
              />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="px-6 py-2 text-red-600 border border-red-600 rounded-full font-semibold hover:bg-red-50 transition"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-white border-b dark:bg-black dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-red-600">You</span>
            <span className="text-black dark:text-white">Tube</span>
          </span>
        </div>
      </header>
    }>
      <HeaderInner />
    </Suspense>
  );
}