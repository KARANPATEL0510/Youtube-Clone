'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';

export default function CreateChannelPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const checkChannel = async () => {
      try {
        const res = await fetch(`/api/channels?userId=${user.uid}`);
        if (res.ok) {
          router.push('/channel-dashboard');
        }
      } catch {
        // No channel exists, continue to creation
      }
    };

    checkChannel();
  }, [router, user]);

  if (loading) return <div className="p-8">Loading...</div>;

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Please log in to create a channel</p>
        <button
          onClick={() => router.push('/auth/login')}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
        >
          Log In
        </button>
      </div>
    );
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      if (!channelName.trim()) {
        throw new Error('Channel name is required');
      }

      console.log('Creating channel:', { userId: user.uid, channelName });

      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          channelName: channelName.trim(),
          description: description.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error('Channel creation failed:', data);
        throw new Error(data.error || `Channel creation failed (${res.status})`);
      }

      const channel = await res.json();
      console.log('Channel created successfully:', channel);
      router.push('/channel-dashboard');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Creation failed';
      console.error('Error creating channel:', errorMsg);
      setError(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-2">Create Your Channel</h1>
          <p className="text-gray-600 mb-8">
            Start sharing your content with the world. Create your channel to upload videos and connect with viewers.
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateChannel} className="space-y-6">
            {/* Channel Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel Name *
              </label>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="My Awesome Channel"
                disabled={creating}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{channelName.length}/100</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your channel. What will you create?"
                disabled={creating}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What&apos;s Next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Customize your channel (profile picture, banner)</li>
                <li>✓ Upload your first video</li>
                <li>✓ Grow your audience</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={creating || !channelName.trim()}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              {creating ? 'Creating Channel...' : 'Create Channel'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              You can always edit these details later
            </p>
          </form>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[
            {
              title: 'Upload Videos',
              description: 'Share your content with viewers around the world',
              icon: '🎬',
            },
            {
              title: 'Build Community',
              description: 'Connect with your audience and grow your subscriber base',
              icon: '👥',
            },
            {
              title: 'Analytics',
              description: 'Track views, engagement, and channel performance',
              icon: '📊',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-lg shadow p-6 text-center"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
