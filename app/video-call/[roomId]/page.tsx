'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useWebRTC } from '@/lib/hooks/useWebRTC';
import {
  getRoomById,
  joinRoom,
  leaveRoom,
  subscribeRoom,
  subscribeMessages,
  sendChatMessage,
  Room,
  ChatMessage,
} from '@/lib/db/rooms';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, Monitor, MonitorOff,
  MessageSquare, Users, PhoneOff, Copy, Share2, Check,
  Send, X, Loader2, Wifi, WifiOff, Clock, Circle,
} from 'lucide-react';

// ── Meeting timer ─────────────────────────────────────────────────────────────
function useMeetingTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Video tile ────────────────────────────────────────────────────────────────
function VideoTile({
  stream,
  label,
  muted = false,
  isLocal = false,
  isCameraOff = false,
  avatarUrl,
}: {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  isLocal?: boolean;
  isCameraOff?: boolean;
  avatarUrl?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden flex items-center justify-center"
      style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Video element */}
      {stream && !isCameraOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={label} className="w-20 h-20 rounded-full object-cover border-4 border-white/20" />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #ef4444, #8b5cf6)' }}>
              {label.charAt(0).toUpperCase()}
            </div>
          )}
          {!stream && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting…
            </div>
          )}
        </div>
      )}

      {/* Name label */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-lg text-xs font-medium text-white"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          {label} {isLocal && '(You)'}
        </span>
      </div>
    </div>
  );
}

// ── Share modal ───────────────────────────────────────────────────────────────
function ShareModal({ roomId, onClose }: { roomId: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== 'undefined' ? `${window.location.origin}/video-call/${roomId}` : '';

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      name: 'WhatsApp', color: '#25d366', emoji: '💬',
      url: `https://wa.me/?text=${encodeURIComponent(`Join my meeting: ${link}`)}`,
    },
    {
      name: 'Telegram', color: '#0088cc', emoji: '✈️',
      url: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Join my meeting')}`,
    },
    {
      name: 'Gmail', color: '#ea4335', emoji: '📧',
      url: `mailto:?subject=${encodeURIComponent('Join my meeting')}&body=${encodeURIComponent(`Join my video meeting:\n${link}`)}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onClick={onClose}>
      <div className="rounded-3xl p-7 w-full max-w-sm relative"
        style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-white font-bold text-lg mb-1">Share Meeting</h3>
        <p className="text-gray-500 text-sm mb-5">Invite others to join this room</p>

        {/* Room ID */}
        <div className="mb-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Room Code</p>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-white font-mono font-bold tracking-widest flex-1">{roomId}</span>
            <button onClick={copy} className="text-gray-400 hover:text-white transition">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Meeting link */}
        <div className="mb-6">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Meeting Link</p>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-gray-400 font-mono truncate"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="truncate flex-1">{link}</span>
            <button onClick={copy} className="flex-shrink-0 text-gray-400 hover:text-white transition">
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="space-y-2.5">
          {shareOptions.map((opt) => (
            <a key={opt.name} href={opt.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white text-sm font-medium transition-all hover:scale-[1.02]"
              style={{ background: `${opt.color}22`, border: `1px solid ${opt.color}44` }}>
              <span className="text-lg">{opt.emoji}</span>
              <span>Share via {opt.name}</span>
            </a>
          ))}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={() => navigator.share({ title: 'Join my meeting', url: link })}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white text-sm font-medium transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Share2 className="w-4 h-4" />
              More options…
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main room page ────────────────────────────────────────────────────────────
export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const router = useRouter();
  const { user, userProfile } = useAuth();

  // Room state
  const [room, setRoom] = useState<Room | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // UI panels
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copyRoomId, setCopyRoomId] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const timer = useMeetingTimer();

  // ── Validate & join room ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !roomId) return;

    async function init() {
      try {
        // Validate room directly via client-side Firestore
        const roomData = await getRoomById(roomId);
        if (!roomData) {
          setRoomError('This meeting does not exist or has expired.');
          setRoomLoading(false);
          return;
        }
        const creator = roomData.createdBy === user!.uid;
        setIsCreator(creator);

        // Join room (add participant)
        await joinRoom(
          roomId,
          user!.uid,
          userProfile?.displayName || user!.displayName || 'Anonymous',
          userProfile?.photoURL || user!.photoURL || ''
        );
        setHasJoined(true);
        setRoomLoading(false);

        // Auto-open share modal for creator so they can invite friends immediately
        if (creator) setIsShareOpen(true);
      } catch (err) {
        console.error('[Room] init error:', err);
        setRoomError('Failed to join room. Please try again.');
        setRoomLoading(false);
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roomId]);

  // ── Subscribe to room ────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasJoined) return;
    const unsub = subscribeRoom(roomId, (r) => {
      setRoom(r);
      if (r?.status === 'ended') {
        router.replace('/video-call');
      }
    });
    return unsub;
  }, [hasJoined, roomId, router]);

  // ── Subscribe to chat ────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasJoined) return;
    const unsub = subscribeMessages(roomId, (msgs) => {
      setMessages(msgs);
      if (!isChatOpen) setUnreadCount((c) => c + 1);
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasJoined, roomId]);

  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isChatOpen, messages]);

  // ── WebRTC ───────────────────────────────────────────────────────────────
  const {
    localStream, remoteStream,
    isMicEnabled, isCameraEnabled,
    isScreenSharing, isRecording,
    connectionState, mediaError, screenShareError,
    toggleMic, toggleCamera,
    startScreenShare, stopScreenShare,
    startRecording, stopRecording,
    cleanup,
  } = useWebRTC(roomId, isCreator, hasJoined);

  // ── Leave room ───────────────────────────────────────────────────────────
  const handleLeave = useCallback(async () => {
    if (!user || isLeaving) return;
    setIsLeaving(true);
    cleanup();
    const participantCount = Object.keys(room?.participants || {}).length;
    await leaveRoom(roomId, user.uid, participantCount <= 1);
    router.replace('/video-call');
  }, [user, isLeaving, cleanup, room, roomId, router]);

  // Cleanup on unmount
  useEffect(() => () => { cleanup(); }, [cleanup]);

  // ── Handle beforeunload ──────────────────────────────────────────────────
  useEffect(() => {
    const handleUnload = () => {
      if (user) leaveRoom(roomId, user.uid, Object.keys(room?.participants || {}).length <= 1);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [user, roomId, room]);

  // ── Chat send ────────────────────────────────────────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;
    const text = chatInput.trim();
    setChatInput('');
    await sendChatMessage(
      roomId,
      user.uid,
      userProfile?.displayName || user.displayName || 'Anonymous',
      text
    );
  };

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopyRoomId(true);
    setTimeout(() => setCopyRoomId(false), 2000);
  };

  // ── Participants ─────────────────────────────────────────────────────────
  const participants = Object.values(room?.participants || {});

  // ── Loading / Error states ───────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-center">
          <p className="text-gray-400 mb-4">You must be signed in to join a meeting.</p>
          <a href="/auth/login" className="px-6 py-2.5 rounded-xl text-white font-semibold"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Joining meeting…</p>
        </div>
      </div>
    );
  }

  if (roomError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <WifiOff className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Cannot Join Meeting</h2>
          <p className="text-gray-400 text-sm mb-6">{roomError}</p>
          <button onClick={() => router.push('/video-call')}
            className="px-6 py-2.5 rounded-xl text-white font-semibold transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            Back to Video Call
          </button>
        </div>
      </div>
    );
  }

  if (mediaError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <VideoOff className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Camera Access Required</h2>
          <p className="text-gray-400 text-sm mb-6">{mediaError}</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl text-white font-semibold transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentUserName = userProfile?.displayName || user.displayName || 'You';
  const currentUserPhoto = userProfile?.photoURL || user.photoURL || '';

  // ── Full room UI ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#0a0a0a' }}>

      {/* ── Top info bar ── */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 z-20"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Left: branding + timer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <VideoIcon className="w-5 h-5 text-red-500" />
            <span className="text-white font-bold text-sm hidden sm:block">Video Call</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-300 text-sm"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">{timer}</span>
          </div>
          {/* Connection indicator */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${
            connectionState === 'connected' ? 'text-green-400' :
            connectionState === 'connecting' ? 'text-yellow-400' :
            'text-gray-500'
          }`} style={{ background: 'rgba(255,255,255,0.05)' }}>
            {connectionState === 'connected' ? <Wifi className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
            <span className="hidden sm:inline capitalize">{connectionState === 'idle' ? 'Waiting…' : connectionState}</span>
          </div>
        </div>

        {/* Right: room code + share + REC indicator */}
        <div className="flex items-center gap-2">
          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg animate-pulse"
              style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}>
              <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500" />
              <span className="text-red-400 text-xs font-bold">REC</span>
            </div>
          )}
          <button onClick={copyRoomCode}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-300 text-xs font-mono transition hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            title="Copy room code">
            <span className="hidden sm:inline">{roomId}</span>
            {copyRoomId ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* ── Main video area ── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Video grid */}
        <div className={`flex-1 p-3 transition-all duration-300 ${isChatOpen || isParticipantsOpen ? 'mr-0 sm:mr-80' : ''}`}>
          <div className="w-full h-full relative">
            {/* Remote video — full area */}
            <div className="w-full h-full">
              <VideoTile
                stream={remoteStream}
                label={participants.find(p => p.uid !== user.uid)?.displayName || 'Participant'}
                avatarUrl={participants.find(p => p.uid !== user.uid)?.photoURL}
              />
            </div>

            {/* Waiting overlay when alone */}
            {participants.length <= 1 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl"
                style={{ background: 'rgba(10,10,10,0.7)', backdropFilter: 'blur(4px)' }}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse"
                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <Users className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-white font-semibold mb-2">Waiting for others to join…</p>
                  <p className="text-gray-500 text-sm">Share the room code to invite participants</p>
                  <button onClick={() => setIsShareOpen(true)}
                    className="mt-4 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                    <Share2 className="w-4 h-4 inline mr-2" />Share Link
                  </button>
                </div>
              </div>
            )}

            {/* Local video — PiP bottom-right */}
            <div className="absolute bottom-4 right-4 w-36 h-24 sm:w-48 sm:h-32 rounded-xl overflow-hidden shadow-2xl z-10"
              style={{ border: '2px solid rgba(255,255,255,0.15)' }}>
              <VideoTile
                stream={localStream}
                label={currentUserName}
                muted
                isLocal
                isCameraOff={!isCameraEnabled}
                avatarUrl={currentUserPhoto}
              />
            </div>
          </div>
        </div>

        {/* ── Chat panel ── */}
        <div className={`absolute right-0 top-0 bottom-0 w-80 flex flex-col transition-transform duration-300 z-10 ${
          isChatOpen ? 'translate-x-0' : 'translate-x-full'
        }`} style={{ background: '#111', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-semibold text-sm">In-call chat</h3>
            <button onClick={() => setIsChatOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-gray-600 text-sm text-center mt-8">No messages yet.<br />Start the conversation!</p>
            )}
            {messages.map((msg) => {
              const isMine = msg.senderUid === user.uid;
              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  {!isMine && <span className="text-gray-500 text-[10px] mb-1 ml-1">{msg.senderName}</span>}
                  <div className={`px-3 py-2 rounded-xl text-sm max-w-[85%] ${
                    isMine ? 'text-white' : 'text-gray-200'
                  }`} style={{
                    background: isMine ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255,255,255,0.1)',
                  }}>
                    {msg.text}
                  </div>
                  <span className="text-gray-600 text-[10px] mt-1 mx-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send a message…"
              className="flex-1 px-3 py-2 rounded-xl text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <button type="submit" disabled={!chatInput.trim()}
              className="p-2 rounded-xl text-white transition disabled:opacity-40"
              style={{ background: 'rgba(239,68,68,0.8)' }}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* ── Participants panel ── */}
        <div className={`absolute right-0 top-0 bottom-0 w-80 flex flex-col transition-transform duration-300 z-10 ${
          isParticipantsOpen ? 'translate-x-0' : 'translate-x-full'
        }`} style={{ background: '#111', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-semibold text-sm">Participants ({participants.length})</h3>
            <button onClick={() => setIsParticipantsOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {participants.map((p) => (
              <div key={p.uid} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                {p.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photoURL} alt={p.displayName} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #8b5cf6)' }}>
                    {p.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-white text-sm font-medium">
                    {p.displayName} {p.uid === user.uid && <span className="text-gray-500">(You)</span>}
                  </p>
                  <p className="text-gray-500 text-xs">{p.uid === room?.createdBy ? 'Host' : 'Participant'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Control bar ── */}
      <div className="flex-shrink-0 flex items-center justify-center gap-3 px-4 py-4 z-20"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Mic */}
        <ControlButton
          onClick={toggleMic}
          active={isMicEnabled}
          activeIcon={<Mic className="w-5 h-5" />}
          inactiveIcon={<MicOff className="w-5 h-5" />}
          label={isMicEnabled ? 'Mute' : 'Unmute'}
        />

        {/* Camera */}
        <ControlButton
          onClick={toggleCamera}
          active={isCameraEnabled}
          activeIcon={<VideoIcon className="w-5 h-5" />}
          inactiveIcon={<VideoOff className="w-5 h-5" />}
          label={isCameraEnabled ? 'Stop camera' : 'Start camera'}
        />

        {/* Screen share */}
        <ControlButton
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          active={!isScreenSharing}
          activeIcon={<Monitor className="w-5 h-5" />}
          inactiveIcon={<MonitorOff className="w-5 h-5" />}
          label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          isHighlighted={isScreenSharing}
          highlightColor="#3b82f6"
        />

        {/* Chat */}
        <ControlButton
          onClick={() => { setIsChatOpen(!isChatOpen); setIsParticipantsOpen(false); }}
          active={!isChatOpen}
          activeIcon={<MessageSquare className="w-5 h-5" />}
          inactiveIcon={<MessageSquare className="w-5 h-5" />}
          label="Chat"
          badge={!isChatOpen && unreadCount > 0 ? unreadCount : 0}
          isHighlighted={isChatOpen}
          highlightColor="#8b5cf6"
        />

        {/* Participants */}
        <ControlButton
          onClick={() => { setIsParticipantsOpen(!isParticipantsOpen); setIsChatOpen(false); }}
          active={!isParticipantsOpen}
          activeIcon={<Users className="w-5 h-5" />}
          inactiveIcon={<Users className="w-5 h-5" />}
          label={`People (${participants.length})`}
          isHighlighted={isParticipantsOpen}
          highlightColor="#8b5cf6"
        />

        {/* Record / Stop Recording */}
        <ControlButton
          onClick={isRecording ? stopRecording : startRecording}
          active={!isRecording}
          activeIcon={<Circle className="w-5 h-5" />}
          inactiveIcon={<Circle className="w-5 h-5 fill-red-500 text-red-500" />}
          label={isRecording ? 'Stop REC' : 'Record'}
          isHighlighted={isRecording}
          highlightColor="#ef4444"
        />

        {/* Leave */}
        <button
          onClick={handleLeave}
          disabled={isLeaving}
          className="flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-2xl font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }}
          title="Leave meeting">
          {isLeaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <PhoneOff className="w-5 h-5" />}
          <span className="text-xs hidden sm:block">Leave</span>
        </button>
      </div>

      {/* ── Share modal ── */}
      {isShareOpen && <ShareModal roomId={roomId} onClose={() => setIsShareOpen(false)} />}

      {/* ── Screen share unsupported toast ── */}
      {screenShareError && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-2xl animate-bounce"
          style={{ background: 'rgba(239,68,68,0.95)', backdropFilter: 'blur(8px)' }}>
          <MonitorOff className="w-4 h-4 flex-shrink-0" />
          {screenShareError}
        </div>
      )}
    </div>
  );
}

// ── Control button helper ─────────────────────────────────────────────────────
function ControlButton({
  onClick, active, activeIcon, inactiveIcon, label, badge = 0,
  isHighlighted = false, highlightColor = '#8b5cf6',
}: {
  onClick: () => void;
  active: boolean;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  label: string;
  badge?: number;
  isHighlighted?: boolean;
  highlightColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-1.5 p-3 sm:px-4 sm:py-2.5 rounded-2xl text-white transition-all hover:scale-105 active:scale-95"
      style={{
        background: isHighlighted
          ? `${highlightColor}33`
          : active ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.2)',
        border: isHighlighted
          ? `1px solid ${highlightColor}66`
          : active ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(239,68,68,0.4)',
      }}
      title={label}
    >
      {active ? activeIcon : inactiveIcon}
      <span className="text-[10px] hidden sm:block text-gray-300">{label}</span>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
