"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";

// ─── Constants ────────────────────────────────────────────────────────────────
const SPECIAL_CHAR_REGEX = /[^a-zA-Z0-9\s.,!?'"@#$%&*()\-]/;

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
  { code: "zh", label: "Chinese (Simplified)" },
  { code: "pt", label: "Portuguese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "ru", label: "Russian" },
  { code: "it", label: "Italian" },
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

// ─── Translate button + inline display ───────────────────────────────────────
function TranslateInline({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("");
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition font-medium"
        title="Translate comment"
      >
        <Globe className="w-3.5 h-3.5" />
        Translate
      </button>

      {open && (
        <div className="absolute left-0 top-6 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2 min-w-[180px]">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-xs font-semibold text-gray-500">Translate to</span>
            <button onClick={() => setOpen(false)}>
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          <select
            className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            value={selectedLang}
            onChange={(e) => handleLangChange(e.target.value)}
          >
            <option value="">— Select language —</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {translating && (
        <span className="ml-2 text-xs text-gray-400 animate-pulse">Translating…</span>
      )}

      {error && (
        <span className="ml-2 text-xs text-red-400">{error}</span>
      )}

      {translated && !translating && (
        <div className="mt-2 p-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-indigo-900 dark:text-indigo-200">
            {showOriginal ? text : translated}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-indigo-400">
              {showOriginal ? "Original" : `Translated · ${LANGUAGES.find((l) => l.code === selectedLang)?.label}`}
            </span>
            <button
              onClick={() => setShowOriginal((v) => !v)}
              className="text-xs text-indigo-500 hover:underline"
            >
              {showOriginal ? "Show translation" : "Show original"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Single comment row ───────────────────────────────────────────────────────
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

  // Like / dislike state (seeded from DB data)
  const [likes, setLikes] = useState(comment.likes ?? 0);
  const [dislikes, setDislikes] = useState(comment.dislikes ?? 0);
  const [likedBy, setLikedBy] = useState<string[]>(comment.likedBy ?? []);
  const [dislikedBy, setDislikedBy] = useState<string[]>(comment.dislikedBy ?? []);
  const [reacting, setReacting] = useState(false);
  const [autoRemoved, setAutoRemoved] = useState(false);

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
      if (data.autoRemoved) {
        setAutoRemoved(true);
        onDeleted(comment._id);
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
    if (!window.confirm("Delete this comment?")) return;
    await fetch(`/api/comments?id=${comment._id}&userId=${currentUserId}`, { method: "DELETE" });
    onDeleted(comment._id);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !currentUserId) return;
    setReplyError(null);
    if (SPECIAL_CHAR_REGEX.test(replyText.trim())) {
      setReplyError("Reply contains blocked special characters.");
      return;
    }
    setPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          userId: currentUserId,
          username: currentUserName,
          userAvatar: currentUserAvatar,
          text: replyText.trim(),
          parentId: comment._id,
        }),
      });
      if (res.ok) {
        const { comment: newReply } = await res.json();
        onReplied(comment._id, newReply);
        setReplyText("");
        setShowReplyInput(false);
        setShowReplies(true);
      } else {
        const data = await res.json();
        setReplyError(data.error || "Failed to post reply");
      }
    } finally {
      setPosting(false);
    }
  };

  if (autoRemoved) return null;

  return (
    <div className={`flex gap-3 ${isReply ? "ml-10 mt-3" : "mt-5"}`}>
      <Image
        src={comment.userAvatar || "https://randomuser.me/api/portraits/men/4.jpg"}
        alt={comment.username}
        width={isReply ? 28 : 36}
        height={isReply ? 28 : 36}
        className="rounded-full object-cover flex-shrink-0 self-start mt-0.5"
        style={{ width: isReply ? 28 : 36, height: isReply ? 28 : 36 }}
      />
      <div className="flex-1 min-w-0">
        {/* Author + time + city */}
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-semibold text-sm">
            {comment.username}
            {currentUserId === comment.userId && (
              <span className="ml-1.5 text-xs font-normal text-blue-500">You</span>
            )}
          </span>
          <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
          {comment.userCity && (
            <span className="flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
              <MapPin className="w-2.5 h-2.5" />
              {comment.userCity}
            </span>
          )}
        </div>

        {/* Text */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{comment.text}</p>

        {/* Translate */}
        <div className="mt-1.5">
          <TranslateInline text={comment.text} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {/* Like */}
          <button
            onClick={() => handleReaction("like")}
            disabled={reacting || !currentUserId}
            className={`flex items-center gap-1 text-xs transition disabled:opacity-40 ${
              hasLiked ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
            title={currentUserId ? "Like" : "Sign in to react"}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? "fill-blue-600" : ""}`} />
            <span>{likes}</span>
          </button>

          {/* Dislike */}
          <button
            onClick={() => handleReaction("dislike")}
            disabled={reacting || !currentUserId}
            className={`flex items-center gap-1 text-xs transition disabled:opacity-40 ${
              hasDisliked ? "text-red-500" : "text-gray-500 hover:text-gray-700"
            }`}
            title={currentUserId ? "Dislike (auto-removes at 2)" : "Sign in to react"}
          >
            <ThumbsDown className={`w-3.5 h-3.5 ${hasDisliked ? "fill-red-500" : ""}`} />
            <span>{dislikes}</span>
          </button>

          {!isReply && currentUserId && (
            <button
              onClick={() => setShowReplyInput((v) => !v)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition"
            >
              <Reply className="w-3.5 h-3.5" />
              Reply
            </button>
          )}

          {currentUserId === comment.userId && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>

        {/* Reply input */}
        {showReplyInput && currentUserId && (
          <div className="flex gap-2 mt-3">
            <Image
              src={currentUserAvatar || "https://randomuser.me/api/portraits/men/4.jpg"}
              alt="You"
              width={28}
              height={28}
              className="rounded-full flex-shrink-0"
              style={{ width: 28, height: 28 }}
            />
            <div className="flex-1">
              <input
                type="text"
                value={replyText}
                onChange={(e) => { setReplyText(e.target.value); setReplyError(null); }}
                placeholder={`Reply to ${comment.username}…`}
                className="w-full px-0 py-1 border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500 text-sm"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReply()}
                autoFocus
              />
              {replyError && (
                <p className="text-xs text-red-500 mt-1">{replyError}</p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleReply}
                  disabled={posting || !replyText.trim()}
                  className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {posting ? "Posting…" : "Reply"}
                </button>
                <button
                  onClick={() => { setShowReplyInput(false); setReplyText(""); setReplyError(null); }}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Replies toggle + list */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowReplies((v) => !v)}
              className="flex items-center gap-1 text-sm text-blue-600 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-full transition"
            >
              {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showReplies ? "Hide" : `${comment.replies.length}`}{" "}
              {comment.replies.length === 1 ? "reply" : "replies"}
            </button>
            {showReplies && (
              <div className="space-y-0">
                {comment.replies.map((reply) => (
                  <CommentRow
                    key={reply._id}
                    comment={reply}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    currentUserAvatar={currentUserAvatar}
                    videoId={videoId}
                    onDeleted={onDeleted}
                    onReplied={onReplied}
                    isReply
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Comments component ──────────────────────────────────────────────────
const Comments = ({ videoId }: CommentsProps) => {
  const { user, userProfile } = useAuth();
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "top">("newest");
  const [inputFocused, setInputFocused] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [cityLoading, setCityLoading] = useState(false);

  const currentUserId = user?.uid ?? null;
  const currentUserName = userProfile?.displayName || user?.displayName || "Anonymous";
  const currentUserAvatar =
    userProfile?.photoURL || user?.photoURL || "https://randomuser.me/api/portraits/men/4.jpg";

  // Fetch comments
  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?videoId=${encodeURIComponent(videoId)}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Post new top-level comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId) return;

    // Client-side special character guard
    if (SPECIAL_CHAR_REGEX.test(newComment.trim())) {
      setCommentError(
        "Your comment contains blocked special characters. Please use only letters, numbers, and common punctuation."
      );
      return;
    }

    setPosting(true);
    setCommentError(null);
    setCityLoading(true);

    try {
      const userCity = await getUserCity();
      setCityLoading(false);

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          userId: currentUserId,
          username: currentUserName,
          userAvatar: currentUserAvatar,
          text: newComment.trim(),
          parentId: null,
          userCity,
        }),
      });
      if (res.ok) {
        const { comment } = await res.json();
        setComments((prev) => [{ ...comment, replies: [], likedBy: [], dislikedBy: [] }, ...prev]);
        setNewComment("");
        setInputFocused(false);
      } else {
        const data = await res.json();
        setCommentError(data.error || "Failed to post comment");
      }
    } finally {
      setPosting(false);
      setCityLoading(false);
    }
  };

  // Delete handler (works for both top-level and replies)
  const handleDeleted = (id: string) => {
    setComments((prev) =>
      prev
        .filter((c) => c._id !== id)
        .map((c) => ({ ...c, replies: c.replies.filter((r) => r._id !== id) }))
    );
  };

  // Reply handler — append reply into parent's replies array
  const handleReplied = (parentId: string, newReply: ApiComment) => {
    setComments((prev) =>
      prev.map((c) =>
        c._id === parentId
          ? { ...c, replies: [...(c.replies || []), { ...newReply, replies: [], likedBy: [], dislikedBy: [] }] }
          : c
      )
    );
  };

  const sorted = [...comments].sort((a, b) =>
    sortBy === "top"
      ? b.likes - a.likes
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="mt-8 pb-12">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-lg">
            {loading ? "Comments" : `${comments.length} Comment${comments.length !== 1 ? "s" : ""}`}
          </h3>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "top" | "newest")}
          className="bg-transparent text-sm border border-gray-300 dark:border-gray-600 rounded-full px-3 py-1 cursor-pointer focus:outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="top">Top comments</option>
        </select>
      </div>

      {/* Add comment box */}
      {currentUserId ? (
        <div className="flex gap-3 mb-8">
          <Image
            src={currentUserAvatar}
            alt="You"
            width={36}
            height={36}
            className="rounded-full flex-shrink-0 self-start mt-1"
            style={{ width: 36, height: 36 }}
          />
          <div className="flex-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => { setNewComment(e.target.value); setCommentError(null); }}
              onFocus={() => setInputFocused(true)}
              placeholder="Add a comment…"
              className="w-full px-0 py-2 border-b border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:border-blue-500 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
            />
            {commentError && (
              <div className="flex items-start gap-2 mt-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 dark:text-red-400">{commentError}</p>
              </div>
            )}
            {inputFocused && (
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => { setNewComment(""); setInputFocused(false); setCommentError(null); }}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || posting || cityLoading}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition flex items-center gap-1.5"
                >
                  {cityLoading && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {posting || cityLoading ? "Posting…" : "Comment"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-500 text-center">
          <a href="/auth/login" className="text-blue-600 hover:underline font-semibold">Sign in</a>{" "}
          to leave a comment
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && comments.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center gap-3 text-gray-400">
          <MessageSquare className="w-12 h-12 opacity-30" />
          <p className="font-medium">No comments yet</p>
          <p className="text-sm">Be the first to share your thoughts!</p>
        </div>
      )}

      {/* Comments list */}
      {!loading && sorted.length > 0 && (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {sorted.map((comment) => (
            <div key={comment._id} className="pb-2">
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
    </div>
  );
};

export default Comments;