'use client';
import { useState } from 'react';
import { seedVideos, clearAllVideos } from '@/lib/seed-videos';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Clear all existing videos first
      await clearAllVideos();
      // Then seed new videos
      await seedVideos();
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to seed videos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Seed Database</h1>
        <p className="text-gray-600 mb-6">
          Add 144 sample videos (12 per category) to your Firestore database to test the YouTube Clone app.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 text-sm">
              ✅ <strong>Success!</strong> 144 sample videos have been added to Firestore.
              <br />
              <a href="/" className="underline font-semibold">
                Go to homepage
              </a>
            </p>
          </div>
        )}

        <button
          onClick={handleSeed}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
        >
          {loading ? 'Seeding 144 videos...' : 'Add 144 Sample Videos'}
        </button>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Categories (12 videos each):</h3>
          <ul className="text-sm text-gray-600 space-y-1 grid grid-cols-2">
            <li>• Music</li>
            <li>• Gaming</li>
            <li>• Movies</li>
            <li>• News</li>
            <li>• Sports</li>
            <li>• Technology</li>
            <li>• Comedy</li>
            <li>• Education</li>
            <li>• Science</li>
            <li>• Travel</li>
            <li>• Food</li>
            <li>• Fashion</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
