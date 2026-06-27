'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Friends section has been replaced by Room-Based Video Calling
export default function FriendsPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/video-call'); }, [router]);
  return null;
}
