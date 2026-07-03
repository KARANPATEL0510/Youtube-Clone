"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  ThumbsUp,
  ThumbsDown,
  Reply,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Globe,
  MapPin,
  X,
  Languages,
  ShieldCheck,
  AlertTriangle,
  Send,
  Sparkles,
  Filter,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";

// ─── Constants ────────────────────────────────────────────────────────────────
// Unicode range \u0080-\uFFFF allows all non-ASCII scripts (Hindi, Arabic,
// Chinese, Japanese, Korean, etc.) — only ASCII control/special chars blocked.
const SPECIAL_CHAR_REGEX = /[^a-zA-Z0-9\s.,!?'"@#$%&*()\-\u0080-\uFFFF]/;

// Feature #2 — 18 languages for translation
const LANGUAGES = [
  { code: "en", label: "\uD83C\uDDEC\uD83C\uDDE7 English" },
  { code: "es", label: "\uD83C\uDDEA\uD83C\uDDF8 Spanish" },
  { code: "fr", label: "\uD83C\uDDEB\uD83C\uDDF7 French" },
  { code: "de", label: "\uD83C\uDDE9\uD83C\uDDEA German" },
  { code: "hi", label: "\uD83C\uDDEE\uD83C\uDDF3 Hindi" },
  { code: "ar", label: "\uD83C\uDDF8\uD83C\uDDE6 Arabic" },
  { code: "zh", label: "\uD83C\uDDE8\uD83C\uDDF3 Chinese" },
  { code: "pt", label: "\uD83C\uDDE7\uD83C\uDDF7 Portuguese" },
  { code: "ja", label: "\uD83C\uDDEF\uD83C\uDDF5 Japanese" },
  { code: "ko", label: "\uD83C\uDDF0\uD83C\uDDF7 Korean" },
  { code: "ru", label: "\uD83C\uDDF7\uD83C\uDDFA Russian" },
  { code: "it", label: "\uD83C\uDDEE\uD83C\uDDF9 Italian" },
  { code: "tr", label: "\uD83C\uDDF9\uD83C\uDDF7 Turkish" },
  { code: "nl", label: "\uD83C\uDDF3\uD83C\uDDF1 Dutch" },
  { code: "pl", label: "\uD83C\uDDF5\uD83C\uDDF1 Polish" },
  { code: "sv", label: "\uD83C\uDDF8\uD83C\uDDEA Swedish" },
  { code: "bn", label: "\uD83C\uDDE7\uD83C\uDDE9 Bengali" },
  { code: "ur", label: "\uD83C\uDDF5\uD83C\uDDF0 Urdu" },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiComment {
  _id: string;
  videoId: string;
  userId: string;
  username: string;
  userAvatar: string;
  text: string;
  likes: number;
  likedBy: string[];
  dislikes: number;
  dislikedBy: string[];
  userCity: string;
  parentId: string | null;
  createdAt: string;
  replies: ApiComment[];
}

interface CommentsProps {
  videoId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

async function getUserCity(): Promise<string> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          if (!res.ok) return resolve("");
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "";
          resolve(city);
        } catch {
          resolve("");
        }
      },
      () => resolve(""),
      { timeout: 5000 }
    );
  });
}

// ─── Feature #2 — Comment Translation ────────────────────────────────────────
function TranslateInline({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("");
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node))
        setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const handleTranslate = async (langCode: string) => {
    if (!langCode) return;
    setTranslating(true);
    setError(null);
    setTranslated(null);
    setShowOriginal(false);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang: langCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Translation failed");
      setTranslated(data.translatedText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setTranslating(false);
      setOpen(false);
    }
  };

  const handleLangChange = (langCode: string) => {
    setSelectedLang(langCode);
    handleTranslate(langCode);
  };

  const selectedLangLabel = LANGUAGES.find((l) => l.code === selectedLang)?.label;

  return (
    <div className="relative inline-block" ref={panelRef}>
      {/* Feature #10 — accessible translate button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Translate this comment"
        aria-expanded={open}
        className="group flex items-center gap-1.5 text-xs font-medium text-violet-500 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-all duration-200 px-2 py-1 rounded-full hover:bg-violet-50 dark:hover:bg-violet-900/30"
        title="Translate comment"
      >
        <Languages className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
        Translate
      </button>

      {/* Language picker */}
      {open && (
        <div
          role="dialog"
          aria-label="Select translation language"
          className="absolute left-0 top-8 z-30 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-3 w-56"
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-violet-500" aria-hidden="true" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Translate to</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close language picker"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-0.5 transition"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
          {/* Feature #10 — explicit label for select */}
          <label htmlFor="translate-lang-select" className="sr-only">Choose target language</label>
          <select
            id="translate-lang-select"
            className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded-xl px-2.5 py-2 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400 transition cursor-pointer"
            value={selectedLang}
            onChange={(e) => handleLangChange(e.target.value)}
            autoFocus
          >
            <option value="">— Select language —</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      )}

      {translating && (
        <span className="ml-2 inline-flex items-center gap-1 text-xs text-gray-400" role="status" aria-live="polite">
          <span className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin inline-block" aria-hidden="true" />
          Translating…
        </span>
      )}

      {error && (
        <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-400" role="alert">
          <AlertTriangle className="w-3 h-3" aria-hidden="true" />
          {error}
        </span>
      )}

      {translated && !translating && (
        <div className="mt-2 p-3 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-100 dark:border-violet-800/50 rounded-xl">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-violet-900 dark:text-violet-200">
            {showOriginal ? text : translated}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-violet-100 dark:border-violet-800/30">
            <div className="flex items-center gap-1.5">
              <Languages className="w-3 h-3 text-violet-400" aria-hidden="true" />
              <span className="text-xs text-violet-500 dark:text-violet-400">
                {showOriginal ? "Original text" : `Translated · ${selectedLangLabel}`}
              </span>
            </div>
            <button
              onClick={() => setShowOriginal((v) => !v)}
              className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium"
            >
              {showOriginal ? "View translation" : "View original"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Feature #3 & #4 — Reusable Reaction Button ──────────────────────────────
function ReactionButton({
  id, icon, count, active, activeClass, onClick, disabled, title,
}: {
  id: string; icon: React.ReactNode; count: number; active: boolean;
  activeClass: string; onClick: () => void; disabled: boolean; title: string;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={`${title} (${count})`}
      aria-pressed={active}
      className={`
        group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold
        transition-all duration-200 select-none active:scale-95
        ${
          active
            ? `${activeClass} shadow-sm`
            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
        }
        disabled:opacity-40 disabled:cursor-not-allowed
      `}
    >
      <span className={`transition-transform duration-150 ${active ? "scale-110" : "group-hover:scale-110"}`}>
        {icon}
      </span>
      <span>{count}</span>
    </button>
  );
}

// ─── Feature #8 — Moderation Warning Badge ───────────────────────────────────
function ModerationBadge({ dislikes }: { dislikes: number }) {
  if (dislikes === 0) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
      title="Community moderation active on this comment"
      aria-label={`${dislikes} community report${dislikes > 1 ? "s" : ""}`}
    >
      <ShieldCheck className="w-2.5 h-2.5" aria-hidden="true" />
      {dislikes === 1 ? "1 report" : `${dislikes} reports`}
    </span>
  );
}

// ─── Single Comment Row ───────────────────────────────────────────────────────
function CommentRow({
  comment,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  videoId,
  onDeleted,
  onReplied,
  isReply = false,
}: {
  comment: ApiComment;
  currentUserId: string | null;
  currentUserName: string;
  currentUserAvatar: string;
  videoId: string;
  onDeleted: (id: string) => void;
  onReplied: (parentId: string, newComment: ApiComment) => void;
  isReply?: boolean;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feature #3 & #4 — Like / Dislike state
  const [likes, setLikes] = useState(comment.likes ?? 0);
  const [dislikes, setDislikes] = useState(comment.dislikes ?? 0);
  const [likedBy, setLikedBy] = useState<string[]>(comment.likedBy ?? []);
  const [dislikedBy, setDislikedBy] = useState<string[]>(comment.dislikedBy ?? []);
  const [reacting, setReacting] = useState(false);

  // Feature #7 — auto-removal with fade-out animation
  const [autoRemoved, setAutoRemoved] = useState(false);
  const [removing, setRemoving] = useState(false);

  const hasLiked = currentUserId ? likedBy.includes(currentUserId) : false;
  const hasDisliked = currentUserId ? dislikedBy.includes(currentUserId) : false;

  const handleReaction = async (action: "like" | "dislike") => {
    if (!currentUserId || reacting) return;
    setReacting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: comment._id, userId: currentUserId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Feature #7 — smooth fade-out before removing
      if (data.autoRemoved) {
        setRemoving(true);
        setTimeout(() => { setAutoRemoved(true); onDeleted(comment._id); }, 500);
      } else {
        setLikes(data.likes);
        setDislikes(data.dislikes);
        setLikedBy(data.likedBy);
        setDislikedBy(data.dislikedBy);
      }
    } finally {
      setReacting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUserId) return;
    if (!window.confirm("Delete this comment? This cannot be undone.")) return;
    setIsDeleting(true);
    await fetch(`/api/comments?id=${comment._id}&userId=${currentUserId}`, { method: "DELETE" });
    onDeleted(comment._id);
  };

  // Feature #6 — special char filter on replies too
  const handleReply = async () => {
    if (!replyText.trim() || !currentUserId) return;
    setReplyError(null);
    if (SPECIAL_CHAR_REGEX.test(replyText.trim())) {
      setReplyError("Reply contains blocked special characters. Use letters, numbers, and common punctuation only.");
      return;
    }
    setPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId, userId: currentUserId, username: currentUserName,
          userAvatar: currentUserAvatar, text: replyText.trim(), parentId: comment._id,
        }),
      });
      if (res.ok) {
        const { comment: newReply } = await res.json();
        onReplied(comment._id, newReply);
        setReplyText(""); setShowReplyInput(false); setShowReplies(true);
      } else {
        const data = await res.json();
        setReplyError(data.error || "Failed to post reply");
      }
    } finally { setPosting(false); }
  };

  if (autoRemoved) return null;

  return (
    <div
      className={`
        flex gap-3 transition-all duration-500
        ${isReply ? "ml-12 mt-3" : "mt-5"}
        ${removing ? "opacity-0 scale-95 pointer-events-none" : "opacity-100"}
        ${isDeleting ? "opacity-40" : ""}
      `}
    >
      {/* Avatar */}
      <div
        className="rounded-full overflow-hidden flex-shrink-0 self-start mt-0.5 ring-2 ring-transparent hover:ring-blue-400 transition-all duration-200"
        style={{ width: isReply ? 28 : 36, height: isReply ? 28 : 36 }}
      >
        <Image
          src={comment.userAvatar || "https://randomuser.me/api/portraits/men/4.jpg"}
          alt={comment.username}
          width={isReply ? 28 : 36}
          height={isReply ? 28 : 36}
          className="object-cover w-full h-full"
          style={{ width: isReply ? 28 : 36, height: isReply ? 28 : 36 }}
        />
      </div>

      <div className="flex-1 min-w-0">
        {/* Author + time + city (Feature #5) + moderation badge (Feature #8) */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{comment.username}</span>
          {currentUserId === comment.userId && (
            <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">YOU</span>
          )}
          <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
          {/* Feature #5 — City Display */}
          {comment.userCity && (
            <span
              className="flex items-center gap-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800"
              aria-label={`Comment from ${comment.userCity}`}
            >
              <MapPin className="w-2.5 h-2.5" aria-hidden="true" />
              {comment.userCity}
            </span>
          )}
          {/* Feature #8 — moderation badge */}
          <ModerationBadge dislikes={dislikes} />
        </div>

        {/* Feature #1 — any language text */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
          {comment.text}
        </p>

        {/* Feature #2 — Translation */}
        <div className="mt-1.5">
          <TranslateInline text={comment.text} />
        </div>

        {/* Action row */}
        <div className="flex items-center gap-1 mt-2 flex-wrap" role="group" aria-label="Comment actions">
          {/* Feature #3 — Like Button */}
          <ReactionButton
            id={`like-${comment._id}`}
            icon={<ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />}
            count={likes} active={hasLiked}
            activeClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700"
            onClick={() => handleReaction("like")}
            disabled={reacting || !currentUserId}
            title={currentUserId ? (hasLiked ? "Unlike this comment" : "Like this comment") : "Sign in to like"}
          />
          {/* Feature #4 — Dislike Button */}
          <ReactionButton
            id={`dislike-${comment._id}`}
            icon={<ThumbsDown className="w-3.5 h-3.5" aria-hidden="true" />}
            count={dislikes} active={hasDisliked}
            activeClass="bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800"
            onClick={() => handleReaction("dislike")}
            disabled={reacting || !currentUserId}
            title={currentUserId ? "Dislike — auto-removed at 2 dislikes" : "Sign in to dislike"}
          />

          {!isReply && currentUserId && (
            <button
              onClick={() => setShowReplyInput((v) => !v)}
              aria-label="Reply to this comment"
              aria-expanded={showReplyInput}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2.5 py-1.5 rounded-full transition-all duration-200"
            >
              <Reply className="w-3.5 h-3.5" aria-hidden="true" /> Reply
            </button>
          )}

          {currentUserId === comment.userId && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="Delete this comment"
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-2.5 py-1.5 rounded-full transition-all duration-200 ml-auto disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>

        {/* Reply input — Feature #6 special char filter */}
        {showReplyInput && currentUserId && (
          <div className="flex gap-2.5 mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: 28, height: 28 }}>
              <Image src={currentUserAvatar || "https://randomuser.me/api/portraits/men/4.jpg"} alt="Your avatar" width={28} height={28} className="object-cover" style={{ width: 28, height: 28 }} />
            </div>
            <div className="flex-1">
              {/* Feature #10 — sr-only label */}
              <label htmlFor={`reply-input-${comment._id}`} className="sr-only">Reply to {comment.username}</label>
              <input
                id={`reply-input-${comment._id}`}
                type="text"
                value={replyText}
                onChange={(e) => { setReplyText(e.target.value); setReplyError(null); }}
                placeholder={`Reply to ${comment.username}… (any language 🌍)`}
                className="w-full px-0 py-1 border-b border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:border-blue-500 text-sm transition-colors"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReply()}
                autoFocus
              />
              {replyError && (
                <div className="flex items-start gap-1.5 mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-red-600 dark:text-red-400">{replyError}</p>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleReply}
                  disabled={posting || !replyText.trim()}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-full text-xs font-semibold hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3 h-3" aria-hidden="true" />
                  {posting ? "Posting…" : "Reply"}
                </button>
                <button
                  onClick={() => { setShowReplyInput(false); setReplyText(""); setReplyError(null); }}
                  className="px-3.5 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-full text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Replies toggle */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowReplies((v) => !v)}
              aria-expanded={showReplies}
              aria-label={showReplies ? "Hide replies" : `Show ${comment.replies.length} replies`}
              className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2.5 py-1.5 rounded-full transition-all duration-200"
            >
              {showReplies ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
              {showReplies ? "Hide replies" : `${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`}
            </button>
            {showReplies && (
              <div className="border-l-2 border-blue-100 dark:border-blue-900/40 ml-3 pl-1" role="list" aria-label="Replies">
                {comment.replies.map((reply) => (
                  <div key={reply._id} role="listitem">
                    <CommentRow
                      comment={reply} currentUserId={currentUserId}
                      currentUserName={currentUserName} currentUserAvatar={currentUserAvatar}
                      videoId={videoId} onDeleted={onDeleted} onReplied={onReplied} isReply
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Feature #8 — Moderation Info Banner ─────────────────────────────────────
function ModerationBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div
      role="note"
      aria-label="Community moderation information"
      className="flex items-start gap-3 p-3.5 mb-5 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-100 dark:border-violet-800/40 rounded-2xl"
    >
      <div className="flex-shrink-0 mt-0.5 p-1.5 bg-violet-100 dark:bg-violet-900/40 rounded-xl">
        <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-0.5">Community Moderation Active</p>
        <p className="text-xs text-violet-600/80 dark:text-violet-400/80 leading-relaxed">
          Comments with <strong>2+ dislikes</strong> are auto-removed. Special characters are blocked.
          All languages welcome — use <strong>Translate</strong> to read in your language.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss moderation notice"
        className="text-violet-400 hover:text-violet-600 dark:hover:text-violet-200 flex-shrink-0 p-0.5 rounded-full hover:bg-violet-100 dark:hover:bg-violet-900/40 transition"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

// ─── Features #1 #6 #9 #10 — Comment Input Box ───────────────────────────────
function CommentInputBox({
  currentUserAvatar, currentUserName, onPost,
}: {
  currentUserAvatar: string; currentUserName: string;
  onPost: (text: string) => Promise<{ error?: string }>;
}) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [posting, setPosting] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charWarning, setCharWarning] = useState(false);
  const MAX = 1000;
  const inputId = "new-comment-input";

  const handleChange = (val: string) => {
    setText(val);
    setError(null);
    setCharWarning(val.length > 0 && SPECIAL_CHAR_REGEX.test(val)); // Feature #6 real-time
  };

  const handlePost = async () => {
    if (!text.trim()) return;
    if (SPECIAL_CHAR_REGEX.test(text.trim())) {
      setError("Your comment contains blocked special characters. Please use only letters, numbers, and common punctuation.");
      return;
    }
    setPosting(true); setCityLoading(true);
    const result = await onPost(text.trim());
    setPosting(false); setCityLoading(false);
    if (result.error) { setError(result.error); }
    else { setText(""); setFocused(false); }
  };

  return (
    <div className="flex gap-3 mb-8">
      <div className="rounded-full overflow-hidden flex-shrink-0 self-start mt-1" style={{ width: 38, height: 38 }} aria-hidden="true">
        <Image src={currentUserAvatar || "https://randomuser.me/api/portraits/men/4.jpg"} alt="" width={38} height={38} className="object-cover" style={{ width: 38, height: 38 }} />
      </div>
      <div className="flex-1">
        {/* Feature #10 — sr-only label for the input */}
        <label htmlFor={inputId} className="sr-only">Add a comment as {currentUserName}. Comments in any language are welcome.</label>
        <div className={`relative border-b-2 transition-colors duration-200 ${
          focused ? (charWarning ? "border-amber-400" : "border-blue-500") : "border-gray-200 dark:border-gray-700"
        }`}>
          <input
            id={inputId}
            type="text"
            value={text}
            maxLength={MAX}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Add a comment… (any language welcome 🌍)"
            aria-describedby={charWarning ? "comment-char-warning" : error ? "comment-error" : undefined}
            className="w-full px-0 py-2.5 bg-transparent focus:outline-none text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePost()}
          />
          {/* Character counter */}
          {focused && text.length > 0 && (
            <span aria-live="polite" className={`absolute right-0 bottom-2 text-[10px] font-medium ${
              text.length > MAX * 0.9 ? "text-red-500" : "text-gray-400"
            }`}>{text.length}/{MAX}</span>
          )}
        </div>

        {/* Feature #6 real-time char warning */}
        {charWarning && text.length > 0 && (
          <div id="comment-char-warning" role="alert" className="flex items-center gap-1.5 mt-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" aria-hidden="true" />
            <p className="text-xs text-amber-600 dark:text-amber-400">Some characters may be blocked — only letters, numbers and common punctuation are allowed.</p>
          </div>
        )}
        {error && (
          <div id="comment-error" role="alert" className="flex items-start gap-2 mt-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {focused && (
          <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
            {/* Feature #8 — moderation hint */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Filter className="w-3 h-3" aria-hidden="true" />
              <span>Auto-moderated · Special chars blocked</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setText(""); setFocused(false); setError(null); setCharWarning(false); }}
                className="px-4 py-2 rounded-full text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >Cancel</button>
              <button
                onClick={handlePost}
                disabled={!text.trim() || posting || cityLoading || charWarning}
                aria-label="Post your comment"
                className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95"
              >
                {(posting || cityLoading) && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />}
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                {posting || cityLoading ? "Posting…" : "Comment"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Comments Component ──────────────────────────────────────────────────
const Comments = ({ videoId }: CommentsProps) => {
  const { user, userProfile } = useAuth();
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "top">("newest");
  const sortId = "comment-sort-select";

  const currentUserId = user?.uid ?? null;
  const currentUserName = userProfile?.displayName || user?.displayName || "Anonymous";
  const currentUserAvatar = userProfile?.photoURL || user?.photoURL || "https://randomuser.me/api/portraits/men/4.jpg";

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?videoId=${encodeURIComponent(videoId)}`);
      if (res.ok) { const data = await res.json(); setComments(data.comments || []); }
    } catch (err) { console.error("Failed to load comments:", err); }
    finally { setLoading(false); }
  }, [videoId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Feature #5 — city gathered inside handlePost before POSTing
  const handlePost = async (text: string): Promise<{ error?: string }> => {
    if (!currentUserId) return { error: "You must be signed in to comment." };
    let userCity = "";
    try { userCity = await getUserCity(); } catch { /* denied */ }
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, userId: currentUserId, username: currentUserName, userAvatar: currentUserAvatar, text, parentId: null, userCity }),
    });
    if (res.ok) {
      const { comment } = await res.json();
      setComments((prev) => [{ ...comment, replies: [], likedBy: [], dislikedBy: [] }, ...prev]);
      return {};
    } else {
      const data = await res.json();
      return { error: data.error || "Failed to post comment" };
    }
  };

  const handleDeleted = (id: string) => {
    setComments((prev) => prev.filter((c) => c._id !== id).map((c) => ({ ...c, replies: c.replies.filter((r) => r._id !== id) })));
  };

  const handleReplied = (parentId: string, newReply: ApiComment) => {
    setComments((prev) => prev.map((c) =>
      c._id === parentId
        ? { ...c, replies: [...(c.replies || []), { ...newReply, replies: [], likedBy: [], dislikedBy: [] }] }
        : c
    ));
  };

  const sorted = [...comments].sort((a, b) =>
    sortBy === "top" ? b.likes - a.likes : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    // Feature #10 — section landmark with aria-label
    <section className="mt-8 pb-16" aria-label="Comments section" id="comments-section">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-300" aria-hidden="true" />
          </div>
          <div>
            {/* Feature #10 — correct heading level */}
            <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight">
              {loading ? "Comments" : `${comments.length} Comment${comments.length !== 1 ? "s" : ""}`}
            </h2>
            {/* Feature #9 — Inclusive UX subtitle */}
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              Multilingual · Auto-moderated
            </p>
          </div>
        </div>
        {/* Feature #10 — explicit label for sort control */}
        <div className="flex items-center gap-2">
          <label htmlFor={sortId} className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Sort by</label>
          <select
            id={sortId}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "top" | "newest")}
            aria-label="Sort comments"
            className="bg-white dark:bg-gray-900 text-sm border border-gray-200 dark:border-gray-700 rounded-full px-3.5 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm font-medium"
          >
            <option value="newest">🕐 Newest first</option>
            <option value="top">🔥 Top comments</option>
          </select>
        </div>
      </div>

      {/* Feature #8 — Moderation Banner */}
      <ModerationBanner />

      {/* Features #1 #6 #9 #10 — Comment Input */}
      {currentUserId ? (
        <CommentInputBox
          currentUserAvatar={currentUserAvatar}
          currentUserName={currentUserName}
          onPost={handlePost}
        />
      ) : (
        // Feature #9 — Inclusive sign-in prompt
        <div
          className="mb-8 p-5 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 text-center"
          role="note"
        >
          <Globe className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            Join the conversation in <span className="font-semibold text-blue-600">any language</span>
          </p>
          <p className="text-xs text-gray-400">
            <a href="/auth/login" className="text-blue-600 hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 rounded">Sign in</a>{" "}
            to leave a comment
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-6" aria-busy="true" aria-label="Loading comments">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse" aria-hidden="true">
              <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="flex gap-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-28" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-16" />
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-4/5" />
                <div className="flex gap-3 mt-1">
                  <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-full w-16" />
                  <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-full w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && comments.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center gap-3">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full">
            <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600" aria-hidden="true" />
          </div>
          <p className="font-semibold text-gray-500 dark:text-gray-400">No comments yet</p>
          {/* Feature #9 — inclusive empty state */}
          <p className="text-sm text-gray-400 max-w-xs">Be the first to share your thoughts — comments in any language are welcome! 🌍</p>
        </div>
      )}

      {/* Comments list */}
      {!loading && sorted.length > 0 && (
        <div className="divide-y divide-gray-100 dark:divide-gray-800/70" role="list" aria-label="Comments list">
          {sorted.map((comment) => (
            <div key={comment._id} className="pb-3" role="listitem">
              <CommentRow
                comment={comment}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                currentUserAvatar={currentUserAvatar}
                videoId={videoId}
                onDeleted={handleDeleted}
                onReplied={handleReplied}
              />
            </div>
          ))}
        </div>
      )}

      {/* Features #9 #10 — language footer */}
      {!loading && sorted.length > 0 && (
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-600" aria-label="Translation availability">
          <Globe className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Comments translatable into 18+ languages</span>
          <Languages className="w-3.5 h-3.5" aria-hidden="true" />
        </div>
      )}
    </section>
  );
};

export default Comments;