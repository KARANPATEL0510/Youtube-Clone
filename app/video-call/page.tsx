'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { createRoom } from '@/lib/db/rooms';
import { Video, Link2, ArrowRight, Loader2, Shield, Users, Zap } from 'lucide-react';

export default function VideoCallLobbyPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();

  const [roomIdInput, setRoomIdInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // ── Create a new room ──────────────────────────────────────────────────────
  const handleCreateRoom = async () => {
    if (!user) { router.push('/auth/login'); return; }
    setIsCreating(true);
    try {
      const displayName = userProfile?.displayName || user.displayName || 'Anonymous';
      const photoURL = userProfile?.photoURL || user.photoURL || '';
      const roomId = await createRoom(user.uid, displayName, photoURL);
      router.push(`/video-call/${roomId}`);
    } catch (err) {
      console.error('Error creating room:', err);
      setIsCreating(false);
    }
  };

  // ── Join existing room ─────────────────────────────────────────────────────
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = roomIdInput.trim().toLowerCase();
    if (!id) return;
    if (!user) { router.push('/auth/login'); return; }

    setIsJoining(true);
    setJoinError(null);
    try {
      const res = await fetch(`/api/rooms?roomId=${id}`);
      if (!res.ok) {
        const data = await res.json();
        setJoinError(data.error || 'Room not found');
        setIsJoining(false);
        return;
      }
      router.push(`/video-call/${id}`);
    } catch {
      setJoinError('Failed to join room. Please try again.');
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0a0a0a' }}>

      {/* ── Animated background orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ background: 'radial-gradient(circle, #ef4444, transparent)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10 blur-3xl animate-pulse"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10 blur-3xl animate-pulse"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', animationDelay: '2s' }} />
      </div>

      {/* ── Grid overlay ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12">

        {/* ── Header ── */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <Video className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
            Video <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg, #ef4444, #f97316)' }}>Call</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            Start an instant meeting or join one with a room code. No downloads needed.
          </p>
        </div>

        {/* ── Main Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

          {/* Create Room Card */}
          <div className="rounded-3xl p-8 border border-white/10 backdrop-blur-md relative overflow-hidden group"
            style={{ background: 'rgba(20, 20, 20, 0.8)' }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 50% 50%, rgba(239,68,68,0.08), transparent 70%)' }} />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.1))', border: '1px solid rgba(239,68,68,0.3)' }}>
                <Video className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">New Meeting</h2>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                Generate a unique room link and invite anyone to join your meeting instantly.
              </p>
              <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 24px rgba(239,68,68,0.4)' }}
              >
                {isCreating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Creating room…</>
                ) : (
                  <><Video className="w-5 h-5" /> Start Meeting</>
                )}
              </button>
            </div>
          </div>

          {/* Join Room Card */}
          <div className="rounded-3xl p-8 border border-white/10 backdrop-blur-md relative overflow-hidden group"
            style={{ background: 'rgba(20, 20, 20, 0.8)' }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.06), transparent 70%)' }} />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <Link2 className="w-7 h-7 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Join Meeting</h2>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Enter a room code or paste a meeting link to join an existing meeting.
              </p>
              <form onSubmit={handleJoinRoom} className="space-y-3">
                <input
                  type="text"
                  value={roomIdInput}
                  onChange={(e) => { setRoomIdInput(e.target.value); setJoinError(null); }}
                  placeholder="Enter room code (e.g. abc123xyz)"
                  className="w-full px-4 py-3.5 rounded-xl text-white text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: joinError ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
                  onBlur={(e) => e.target.style.borderColor = joinError ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'}
                />
                {joinError && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <span>⚠️</span> {joinError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isJoining || !roomIdInput.trim()}
                  className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(59,130,246,0.8)', boxShadow: '0 4px 20px rgba(59,130,246,0.3)' }}
                >
                  {isJoining ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Joining…</>
                  ) : (
                    <><ArrowRight className="w-5 h-5" /> Join Meeting</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── Feature highlights ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: 'Secure', desc: 'End-to-end encrypted with WebRTC', color: '#10b981' },
            { icon: Zap, title: 'Instant', desc: 'No sign-up required for guests', color: '#f59e0b' },
            { icon: Users, title: 'Shareable', desc: 'Share via WhatsApp, Telegram & more', color: '#8b5cf6' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="rounded-2xl p-5 border border-white/5 flex items-start gap-4"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Sign-in notice ── */}
        {!user && (
          <p className="text-center text-gray-600 text-sm mt-8">
            <a href="/auth/login" className="text-red-400 hover:underline font-medium">Sign in</a>
            {' '}to create or join meetings.
          </p>
        )}
      </div>
    </div>
  );
}
