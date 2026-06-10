'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import Link from 'next/link';

interface Upload {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  views: number;
  visibility: string;
  createdAt: string;
}

interface Channel {
  _id: string;
  channelName: string;
  description: string;
  subscriberCount: number;
}

export default function ChannelDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('videos');
  const [previewVideo, setPreviewVideo] = useState<Upload | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchChannelData = async () => {
      try {
        setPageLoading(true);
        const [channelRes, uploadsRes] = await Promise.all([
          fetch(`/api/channels?userId=${user.uid}`),
          fetch(`/api/uploads?userId=${user.uid}`),
        ]);

        if (channelRes.ok) {
          setChannel(await channelRes.json());
        } else {
          const errorData = await channelRes.json();
          console.error('Channel fetch error:', errorData);
          throw new Error(errorData.error || `Channel fetch failed (${channelRes.status})`);
        }

        if (uploadsRes.ok) {
          setUploads(await uploadsRes.json());
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load channel';
        console.error('Error in fetchChannelData:', errorMsg);
        setError(errorMsg);
      } finally {
        setPageLoading(false);
      }
    };

    fetchChannelData();
  }, [user]);

  if (loading || pageLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push('/create-channel')}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
        >
          Create Channel
        </button>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <p className="text-gray-600 mb-4">Channel not found</p>
        <button
          onClick={() => router.push('/create-channel')}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
        >
          Create Channel
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Channel Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{channel.channelName}</h1>
              <p className="text-gray-600 mt-2">{channel.description}</p>
              <div className="flex gap-6 mt-4 text-sm">
                <span className="text-gray-600">
                  <strong className="text-gray-900">{uploads.length}</strong> videos
                </span>
                <span className="text-gray-600">
                  <strong className="text-gray-900">{channel.subscriberCount}</strong> subscribers
                </span>
              </div>
            </div>
            <Link
              href="/upload"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Upload Video
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: 'videos', label: 'Videos', icon: '🎬' },
              { id: 'analytics', label: 'Analytics', icon: '📊' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'videos' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Videos</h2>
            {uploads.length === 0 ? (
              <div className="bg-gray-100 rounded-lg p-12 text-center">
                <p className="text-gray-600 mb-4">No videos uploaded yet</p>
                <Link
                  href="/upload"
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg inline-block"
                >
                  Upload Your First Video
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {uploads.map((video) => (
                    <div
                      key={video._id}
                      onClick={() => setPreviewVideo(video)}
                      className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {video.title}
                        </h3>
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>{video.views} views</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            video.visibility === 'public'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {video.visibility}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Video Preview Modal */}
                {previewVideo && (
                  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setPreviewVideo(null)}>
                    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
                      <div className="relative aspect-video bg-black">
                        <video
                          src={previewVideo.videoUrl}
                          controls
                          autoPlay
                          className="w-full h-full"
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{previewVideo.title}</h2>
                            <p className="text-gray-600">{previewVideo.views} views</p>
                          </div>
                          <button
                            onClick={() => setPreviewVideo(null)}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                          >
                            ×
                          </button>
                        </div>
                        <p className="text-gray-700 mb-4">{previewVideo.description}</p>
                        <div className="flex gap-2">
                          <Link
                            href={`/watch/${previewVideo._id}`}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg"
                          >
                            View Full
                          </Link>
                          <button
                            onClick={() => setPreviewVideo(null)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-6 rounded-lg"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Channel Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Views', value: uploads.reduce((sum, v) => sum + v.views, 0), icon: '👁️' },
                { label: 'Videos', value: uploads.length, icon: '🎬' },
                { label: 'Subscribers', value: channel.subscriberCount, icon: '👥' },
                { label: 'Channel Age', value: '0 days', icon: '📅' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-lg shadow p-6">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Channel Settings</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 mb-4">Channel settings coming soon...</p>
              <button
                onClick={() => {
                  /* Handle settings update */
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
