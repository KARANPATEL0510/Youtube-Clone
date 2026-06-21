'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Users,
  UserPlus,
  Video,
  Check,
  X,
  Search,
  Loader2,
  Trash2,
  Mail,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import {
  subscribeFriendships,
  subscribeUsersStatus,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendship,
  FriendProfile,
  Friendship,
} from '@/lib/db/friends';
import { setOnlineStatus, setOfflineStatus, updatePresenceHeartbeat } from '@/lib/db/presence';
import { getFirebaseDb } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { sendOtp, verifyOtpOnServer } from '@/lib/otp-utils';

// ── Add-Friend OTP sub-flow ─────────────────────────────────────────────────

type AddFriendStep = 'email' | 'otp';

function AddFriendPanel({
  currentUserName,
  onSuccess,
  onRequest,
}: {
  currentUserName: string;
  onSuccess: (email: string) => Promise<void>;
  onRequest: (email: string) => void;
}) {
  const [step, setStep] = useState<AddFriendStep>('email');
  const [friendEmail, setFriendEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);

  // countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === 'otp') setTimeout(() => otpRef.current?.focus(), 300);
  }, [step]);

  // Step 1 — send OTP to friend's email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!friendEmail.trim()) return;

    setLoading(true);
    try {
      await sendOtp(friendEmail.trim(), {
        purpose: 'friend-request',
        senderName: currentUserName,
      });
      setInfo(`OTP sent to ${friendEmail}. Ask your friend to share the code with you.`);
      setStep('otp');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Check the email address and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify OTP then create friend request
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otpValue || otpValue.length < 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const valid = await verifyOtpOnServer(friendEmail.trim(), otpValue.trim());
      if (!valid) throw new Error('Invalid or expired OTP. Ask your friend for the latest code.');
      await onSuccess(friendEmail.trim());
      // reset
      setStep('email');
      setFriendEmail('');
      setOtpValue('');
      setInfo(null);
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      await sendOtp(friendEmail.trim(), {
        purpose: 'friend-request',
        senderName: currentUserName,
      });
      setInfo('New OTP sent! Ask your friend for the latest code.');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Resend failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        {step === 'otp' && (
          <button
            onClick={() => { setStep('email'); setOtpValue(''); setError(null); setInfo(null); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
        )}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {step === 'email' ? 'Add a Friend' : 'Verify OTP'}
          </h2>
          <p className="text-xs text-gray-500">
            {step === 'email'
              ? "Enter your friend's exact email address to send them a verification code."
              : `An OTP was sent to ${friendEmail}. Ask your friend to share it with you.`}
          </p>
        </div>
      </div>

      {/* Step progress bar */}
      <div className="flex gap-1 mt-4 mb-5">
        <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step === 'email' ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
        <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step === 'otp' ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
      </div>

      {/* Error / info */}
      {error && (
        <div className="flex items-start gap-2 text-sm px-4 py-3 rounded-xl mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400">
          <span>⚠️</span><span>{error}</span>
        </div>
      )}
      {info && !error && (
        <div className="flex items-start gap-2 text-sm px-4 py-3 rounded-xl mb-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 text-green-600 dark:text-green-400">
          <span>✅</span><span>{info}</span>
        </div>
      )}

      {/* ── Step 1: Email input ── */}
      {step === 'email' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              placeholder="friend@example.com"
              required
              disabled={loading}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !friendEmail.trim()}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {loading ? 'Sending OTP…' : 'Send OTP to Friend\'s Email'}
          </button>
        </form>
      )}

      {/* ── Step 2: OTP verification ── */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {/* Friend email pill */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex-shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">OTP sent to</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{friendEmail}</p>
            </div>
          </div>

          {/* OTP input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enter 6-digit OTP
            </label>
            <input
              ref={otpRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              disabled={loading}
              className="w-full text-center tracking-[0.5em] text-2xl font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-4 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otpValue.length < 6}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {loading ? 'Verifying…' : 'Verify & Send Friend Request'}
          </button>

          {/* Resend */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
              className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:underline disabled:opacity-40 disabled:no-underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function FriendsPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');

  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [friendStatuses, setFriendStatuses] = useState<
    Record<string, { status: 'online' | 'offline'; lastActive: number }>
  >({});

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Presence heartbeat
  useEffect(() => {
    if (!user) return;
    setOnlineStatus(user.uid);
    const interval = setInterval(() => updatePresenceHeartbeat(user.uid), 30000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') setOnlineStatus(user.uid);
      else setOfflineStatus(user.uid);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      setOfflineStatus(user.uid);
    };
  }, [user]);

  // Real-time friendship listener
  useEffect(() => {
    if (!user) return;
    return subscribeFriendships(user.uid, setFriendships);
  }, [user]);

  // Listen to friend statuses
  useEffect(() => {
    const acceptedFriends = friendships.filter((f) => f.status === 'accepted');
    const friendIds = acceptedFriends
      .map((f) => f.userIds.find((id) => id !== user?.uid) || '')
      .filter(Boolean);

    if (friendIds.length === 0) { setFriendStatuses({}); return; }
    return subscribeUsersStatus(friendIds, setFriendStatuses);
  }, [friendships, user]);

  // ── OTP-verified friend request ──────────────────────────────────────────
  const handleAddFriendAfterOtp = async (targetEmail: string) => {
    if (!user) return;
    await sendFriendRequest(
      {
        uid: user.uid,
        displayName: userProfile?.displayName || user.displayName || 'Anonymous',
        photoURL: userProfile?.photoURL || user.photoURL || undefined,
        email: user.email || '',
      },
      targetEmail
    );
    setActionSuccess(`Friend request sent to ${targetEmail}!`);
    setActiveTab('requests');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleAccept = async (friendshipId: string) => {
    try { await acceptFriendRequest(friendshipId); } catch (err) { console.error(err); }
  };

  const handleDecline = async (friendshipId: string) => {
    try { await removeFriendship(friendshipId); } catch (err) { console.error(err); }
  };

  const handleStartCall = async (friend: FriendProfile) => {
    if (!user) return;
    try {
      const callRef = doc(collection(getFirebaseDb(), 'calls'));
      await setDoc(callRef, {
        callId: callRef.id,
        callerId: user.uid,
        callerName: userProfile?.displayName || user.displayName || 'Anonymous',
        callerPhoto: userProfile?.photoURL || user.photoURL || '',
        calleeId: friend.uid,
        calleeName: friend.displayName,
        calleePhoto: friend.photoURL || '',
        status: 'ringing',
        recordingStatus: 'none',
        createdAt: Date.now(),
      });
    } catch (err) {
      console.error('Error starting video call:', err);
      alert('Failed to initiate video call.');
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <Users className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Manage Friends &amp; Call</h2>
        <p className="text-gray-500 max-w-sm mb-6">
          Please sign in to add friends, view their active status, and initiate video calls.
        </p>
        <button
          onClick={() => router.push('/auth')}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Segment lists
  const friendsList = friendships
    .filter((f) => f.status === 'accepted')
    .map((f) => {
      const otherId = f.userIds.find((id) => id !== user.uid) || '';
      const otherUser = f.users[otherId] || {};
      const statusData = friendStatuses[otherId] || { status: 'offline', lastActive: 0 };
      const isOnline = statusData.status === 'online' && Date.now() - statusData.lastActive < 60000;
      return {
        friendshipId: f.id,
        uid: otherId,
        displayName: otherUser.displayName || 'Anonymous',
        photoURL: otherUser.photoURL,
        email: otherUser.email,
        status: isOnline ? 'online' as const : 'offline' as const,
        lastActive: statusData.lastActive,
      };
    });

  const incomingRequests = friendships.filter(
    (f) => f.status === 'pending' && f.requester !== user.uid
  );
  const outgoingRequests = friendships.filter(
    (f) => f.status === 'pending' && f.requester === user.uid
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 min-h-[80vh]">
      {/* Title Header */}
      <div className="flex items-center gap-3 border-b pb-4 mb-6 dark:border-gray-800">
        <div className="p-3 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-2xl">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Friends &amp; Video Calls</h1>
          <p className="text-sm text-gray-500">Add friends via email OTP and coordinate face-to-face video calls</p>
        </div>
      </div>

      {/* Global success banner */}
      {actionSuccess && (
        <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 text-green-700 dark:text-green-400">
          ✅ {actionSuccess}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex items-center gap-2 px-5 py-2.5 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'friends'
              ? 'border-red-600 text-red-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Friends</span>
          {friendsList.length > 0 && (
            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full ml-1">
              {friendsList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-5 py-2.5 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'requests'
              ? 'border-red-600 text-red-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Pending Requests</span>
          {incomingRequests.length > 0 && (
            <span className="bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 text-xs px-2 py-0.5 rounded-full ml-1 animate-pulse font-bold">
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-2 px-5 py-2.5 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'search'
              ? 'border-red-600 text-red-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Friend</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {/* ── Friends list ── */}
        {activeTab === 'friends' && (
          <div className="space-y-4">
            {friendsList.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-900 border border-dashed dark:border-gray-800 p-8 rounded-2xl text-center">
                <p className="text-gray-500 dark:text-gray-400">You haven&apos;t added any friends yet.</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-4 px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 font-medium inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Add your first friend
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friendsList.map((friend) => (
                  <div
                    key={friend.uid}
                    className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-between shadow-sm hover:shadow transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Image
                          src={friend.photoURL || 'https://randomuser.me/api/portraits/men/1.jpg'}
                          alt={friend.displayName}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-gray-900 rounded-full ${
                            friend.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-400'
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[180px]">
                          {friend.displayName}
                        </h3>
                        <p className="text-xs text-gray-500">{friend.email}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {friend.status === 'online'
                            ? '🟢 Online'
                            : friend.lastActive
                            ? `Last active: ${new Date(friend.lastActive).toLocaleTimeString()}`
                            : 'Offline'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartCall(friend)}
                        disabled={friend.status !== 'online'}
                        title={friend.status !== 'online' ? 'User is offline' : 'Start Video Call'}
                        className={`p-2.5 rounded-xl transition flex items-center justify-center ${
                          friend.status === 'online'
                            ? 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 hover:bg-green-200 hover:scale-105'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Video className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDecline(friend.friendshipId)}
                        title="Remove Friend"
                        className="p-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-xl transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Pending requests ── */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Incoming */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Incoming Requests
              </h2>
              {incomingRequests.length === 0 ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                  <p className="text-sm text-gray-500">No pending incoming requests.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map((req) => {
                    const senderId = req.requester;
                    const sender = req.users[senderId] || {};
                    return (
                      <div
                        key={req.id}
                        className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Image
                            src={sender.photoURL || 'https://randomuser.me/api/portraits/men/1.jpg'}
                            alt={sender.displayName || 'User'}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{sender.displayName}</h4>
                            <p className="text-xs text-gray-500">{sender.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(req.id)}
                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center gap-1.5 text-xs font-semibold px-3"
                          >
                            <Check className="w-4 h-4" /> Accept
                          </button>
                          <button
                            onClick={() => handleDecline(req.id)}
                            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 rounded-lg transition flex items-center gap-1.5 text-xs font-semibold px-3"
                          >
                            <X className="w-4 h-4" /> Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Outgoing */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Sent Requests (Pending)
              </h2>
              {outgoingRequests.length === 0 ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                  <p className="text-sm text-gray-500">No sent pending requests.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {outgoingRequests.map((req) => {
                    const otherId = req.userIds.find((id) => id !== user.uid) || '';
                    const receiver = req.users[otherId] || {};
                    return (
                      <div
                        key={req.id}
                        className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Image
                            src={receiver.photoURL || 'https://randomuser.me/api/portraits/men/1.jpg'}
                            alt={receiver.displayName || 'User'}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{receiver.displayName}</h4>
                            <p className="text-xs text-gray-500">{receiver.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDecline(req.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition text-xs font-semibold px-3"
                        >
                          Cancel Request
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Add Friend with OTP ── */}
        {activeTab === 'search' && (
          <AddFriendPanel
            currentUserName={userProfile?.displayName || user.displayName || 'Someone'}
            onSuccess={handleAddFriendAfterOtp}
            onRequest={() => {}}
          />
        )}
      </div>
    </div>
  );
}
