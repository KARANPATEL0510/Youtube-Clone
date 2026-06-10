'use client';
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';

export default function FirebaseTest() {
  const [status, setStatus] = useState<{
    firebase: string;
    auth: string;
    firestore: string;
    config: { apiKey: string; projectId: string; authDomain: string };
  }>({
    firebase: 'Loading...',
    auth: 'Loading...',
    firestore: 'Loading...',
    config: { apiKey: 'Loading...', projectId: 'Loading...', authDomain: 'Loading...' },
  });

  useEffect(() => {
    const checkFirebase = () => {
      const newStatus = {
        firebase: db && auth ? '✅ Firebase initialized' : '❌ Not initialized',
        auth: auth ? '✅ Auth ready' : '❌ Auth not ready',
        firestore: db ? '✅ Firestore ready' : '❌ Firestore not ready',
        config: {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
            ? '✅ Set'
            : '❌ Missing',
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
            ? '✅ Set'
            : '❌ Missing',
        },
      };
      
      console.log('Firebase Status:', newStatus);
      setStatus(newStatus);
    };

    checkFirebase();
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Firebase Configuration Test</h1>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-gray-50">
          <h2 className="font-semibold mb-2">Service Status</h2>
          <p className="text-sm">{status.firebase}</p>
          <p className="text-sm">{status.auth}</p>
          <p className="text-sm">{status.firestore}</p>
        </div>

        <div className="p-4 border rounded-lg bg-gray-50">
          <h2 className="font-semibold mb-2">Environment Variables</h2>
          <p className="text-sm">API Key: {status.config.apiKey}</p>
          <p className="text-sm">Project ID: {status.config.projectId}</p>
          <p className="text-sm">Auth Domain: {status.config.authDomain}</p>
        </div>

        <div className="p-4 border rounded-lg bg-blue-50">
          <h2 className="font-semibold mb-2">✅ Next Steps</h2>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Go to Firebase Console: https://console.firebase.google.com</li>
            <li>Create a new project or select existing one</li>
            <li>Get Web App credentials from Project Settings</li>
            <li>Update .env.local with your credentials</li>
            <li>Refresh this page to verify</li>
          </ol>
        </div>

        <div className="p-4 border rounded-lg bg-yellow-50">
          <h2 className="font-semibold mb-2">⚠️ In Firebase Console, Enable:</h2>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Authentication (Google, Email/Password)</li>
            <li>Firestore Database (Test mode for now)</li>
            <li>Storage (Test mode for now)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
