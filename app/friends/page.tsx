'use client';
import { useState, useEffect } from 'react';
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
  Clock,
  PhoneCall,
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

export default function FriendsPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();

  // Tabs: 'friends' | 'requests' | 'search'
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');

  // Friendship lists
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [friendStatuses, setFriendStatuses] = useState<
    Record<string, { status: 'online' | 'offline'; lastActive: number }>
  >({});

  // Search state
  const [searchEmail, setSearchEmail] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);

  // Presence heartbeat
  useEffect(() => {
    if (!user) return;

    // Set online status immediately on mount
    setOnlineStatus(user.uid);

    // Keep updating lastActive heartbeat every 30 seconds
    const interval = setInterval(() => {
      updatePresenceHeartbeat(user.uid);
    }, 30000);

    // Visibility listener (app minimised/backgrounded)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setOnlineStatus(user.uid);
      } else {
        setOfflineStatus(user.uid);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Unmount -> set offline
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      setOfflineStatus(user.uid);
    };
  }, [user]);

  // Real-time friendship listener
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeFriendships(user.uid, (data) => {
      setFriendships(data);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to friend statuses
  useEffect(() => {
    const acceptedFriends = friendships.filter((f) => f.status === 'accepted');
    const friendIds = acceptedFriends.map((f) => {
      const otherId = f.userIds.find((id) => id !== user?.uid);
      return otherId || '';
    }).filter(Boolean);

    if (friendIds.length === 0) {
      setFriendStatuses({});
      return;
    }

    const unsubscribe = subscribeUsersStatus(friendIds, (statuses) => {
      setFriendStatuses(statuses);
    });

    return () => unsubscribe();
  }, [friendships, user]);

  // Actions
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !searchEmail.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchSuccess(null);

    try {
      await sendFriendRequest(
        {
          uid: user.uid,
          displayName: userProfile?.displayName || user.displayName || 'Anonymous',
          photoURL: userProfile?.photoURL || user.photoURL || undefined,
          email: user.email || '',
        },
        searchEmail
      );
      setSearchSuccess('Friend request sent successfully!');
      setSearchEmail('');
    } catch (err: any) {
      setSearchError(err.message || 'Failed to send request');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAccept = async (friendshipId: string) => {
    try {
      await acceptFriendRequest(friendshipId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = async (friendshipId: string) => {
    try {
      await removeFriendship(friendshipId);
    } catch (err) {
      console.error(err);
    }
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
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Manage Friends & Call</h2>
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

      // Consider online only if lastActive was in the last 60 seconds
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Friends & Video Calls</h1>
          <p className="text-sm text-gray-500">Add friends and coordinate face-to-face video calls</p>
        </div>
      </div>

      {/* Tabs list */}
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
          <Search className="w-4 h-4" />
          <span>Add Friend</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'friends' && (
          <div className="space-y-4">
            {friendsList.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-900 border border-dashed dark:border-gray-800 p-8 rounded-2xl text-center">
                <p className="text-gray-500 dark:text-gray-400">You haven't added any friends yet.</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-4 px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 font-medium inline-flex items-center gap-2"
                >
                  <Search className="w-4 h-4" /> Send your first request
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
                            ? 'Online'
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

        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Incoming requests */}
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
                            alt={sender.displayName}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {sender.displayName}
                            </h4>
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

            {/* Outgoing requests */}
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
                            alt={receiver.displayName}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {receiver.displayName}
                            </h4>
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

        {activeTab === 'search' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Search Friends</h2>
            <p className="text-xs text-gray-500 mb-6">Enter a user's exact email address to send a friend request.</p>

            <form onSubmit={handleAddFriend} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="friend@example.com"
                  required
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-xl transition flex items-center gap-2 text-sm"
              >
                {searchLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>Send Request</span>
              </button>
            </form>

            {searchError && (
              <p className="text-sm font-medium text-red-600 mt-4 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900/40">
                ⚠️ {searchError}
              </p>
            )}

            {searchSuccess && (
              <p className="text-sm font-medium text-green-600 mt-4 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-900/40">
                ✅ {searchSuccess}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
