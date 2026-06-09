import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Comment } from '@/lib/models/Comment';

// Special character validation — blocks anything outside alphanumeric,
// whitespace, and common punctuation: . , ! ? ' " @ # $ % & * ( ) -
const SPECIAL_CHAR_REGEX = /[^a-zA-Z0-9\s.,!?'"@#$%&*()\-]/;

function hasSpecialChars(text: string): boolean {
  return SPECIAL_CHAR_REGEX.test(text);
}

// ─── GET /api/comments?videoId=<id> ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const videoId = req.nextUrl.searchParams.get('videoId');
    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    // Fetch all comments for the video, sorted newest-first
    const rawComments = await Comment.find({ videoId })
      .sort({ createdAt: -1 })
      .lean();

    // Separate top-level and replies
    const topLevel = rawComments.filter((c) => !c.parentId);
    const replies = rawComments.filter((c) => !!c.parentId);

    // Nest replies under their parents
    const nested = topLevel.map((comment) => ({
      ...comment,
      _id: comment._id.toString(),
      replies: replies
        .filter((r) => r.parentId === comment._id.toString())
        .map((r) => ({ ...r, _id: r._id.toString(), replies: [] })),
    }));

    return NextResponse.json({ comments: nested, total: topLevel.length });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// ─── POST /api/comments ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { videoId, userId, username, userAvatar, text, parentId, userCity } =
      await req.json();

    if (!videoId || !userId || !username || !text?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Block special characters
    if (hasSpecialChars(text.trim())) {
      return NextResponse.json(
        { error: 'Comment contains blocked special characters.' },
        { status: 422 }
      );
    }

    const comment = new Comment({
      videoId,
      userId,
      username,
      userAvatar: userAvatar || '',
      text: text.trim(),
      parentId: parentId || null,
      userCity: userCity || '',
    });

    await comment.save();

    return NextResponse.json(
      { comment: { ...comment.toObject(), _id: comment._id.toString() } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}

// ─── PATCH /api/comments — like or dislike a comment ─────────────────────────
// Body: { commentId, userId, action: "like" | "dislike" }
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const { commentId, userId, action } = await req.json();

    if (!commentId || !userId || !['like', 'dislike'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (action === 'like') {
      const alreadyLiked = comment.likedBy.includes(userId);
      if (alreadyLiked) {
        // Toggle off
        comment.likedBy = comment.likedBy.filter((id: string) => id !== userId);
        comment.likes = Math.max(0, comment.likes - 1);
      } else {
        // Add like; remove any existing dislike from this user
        comment.likedBy.push(userId);
        comment.likes += 1;
        if (comment.dislikedBy.includes(userId)) {
          comment.dislikedBy = comment.dislikedBy.filter((id: string) => id !== userId);
          comment.dislikes = Math.max(0, comment.dislikes - 1);
        }
      }
    } else {
      // dislike
      const alreadyDisliked = comment.dislikedBy.includes(userId);
      if (alreadyDisliked) {
        // Toggle off
        comment.dislikedBy = comment.dislikedBy.filter((id: string) => id !== userId);
        comment.dislikes = Math.max(0, comment.dislikes - 1);
      } else {
        // Add dislike; remove any existing like from this user
        comment.dislikedBy.push(userId);
        comment.dislikes += 1;
        if (comment.likedBy.includes(userId)) {
          comment.likedBy = comment.likedBy.filter((id: string) => id !== userId);
          comment.likes = Math.max(0, comment.likes - 1);
        }

        // Auto-remove if dislike threshold reached (2 dislikes)
        if (comment.dislikes >= 2) {
          await Comment.deleteMany({
            $or: [{ _id: commentId }, { parentId: commentId }],
          });
          return NextResponse.json({ autoRemoved: true });
        }
      }
    }

    await comment.save();

    return NextResponse.json({
      likes: comment.likes,
      dislikes: comment.dislikes,
      likedBy: comment.likedBy,
      dislikedBy: comment.dislikedBy,
    });
  } catch (error) {
    console.error('Error updating comment reaction:', error);
    return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
  }
}

// ─── DELETE /api/comments?id=<commentId>&userId=<uid> ─────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const id = req.nextUrl.searchParams.get('id');
    const userId = req.nextUrl.searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    if (comment.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Delete the comment and all its replies
    await Comment.deleteMany({ $or: [{ _id: id }, { parentId: id }] });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
