'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { getFirebaseDb } from '@/lib/firebase';
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { Phone, PhoneOff, Check, X, Loader2, Video } from 'lucide-react';
import Image from 'next/image';
import VideoCallModal from './video-call-modal';

// Synthesized Ringtone using Web Audio API
class RingtoneService {
  private ctx: AudioContext | null = null;
  private interval: any = null;

  start() {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = () => {
        if (!this.ctx) return;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, this.ctx.currentTime); // mixed ringtone freq
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, this.ctx.currentTime);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + 1.8);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(this.ctx.currentTime + 2);
        osc2.stop(this.ctx.currentTime + 2);
      };
      playTone();
      this.interval = setInterval(playTone, 4000);
    } catch (e) {
      console.warn('Audio Context ringtone failed:', e);
    }
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export default function CallManager() {
  const { user } = useAuth();
  const [activeCall, setActiveCall] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [outgoingCall, setOutgoingCall] = useState<any>(null);
  
  // Ringtones
  const incomingRingtone = useRef<RingtoneService | null>(null);
  const outgoingRingtone = useRef<RingtoneService | null>(null);

  useEffect(() => {
    if (!user) {
      // Clear calls if user logs out
      setIncomingCall(null);
      setOutgoingCall(null);
      setActiveCall(null);
      return;
    }

    // Listen for call notifications where user is caller or callee
    const q = query(
      collection(getFirebaseDb(), 'calls'),
      where('status', 'in', ['ringing', 'accepted'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let isUserInCall = false;

      snapshot.forEach((docSnap) => {
        const call = docSnap.data();
        if (call.callerId === user.uid || call.calleeId === user.uid) {
          isUserInCall = true;

          if (call.status === 'ringing') {
            if (call.calleeId === user.uid) {
              // INCOMING CALL
              setIncomingCall(call);
              setOutgoingCall(null);
              setActiveCall(null);
              // Ring the bell
              if (!incomingRingtone.current) {
                incomingRingtone.current = new RingtoneService();
                incomingRingtone.current.start();
              }
            } else if (call.callerId === user.uid) {
              // OUTGOING CALL
              setOutgoingCall(call);
              setIncomingCall(null);
              setActiveCall(null);
              // Play dialing tone
              if (!outgoingRingtone.current) {
                outgoingRingtone.current = new RingtoneService();
                outgoingRingtone.current.start();
              }
            }
          } else if (call.status === 'accepted') {
            // CALL ACCEPTED - Transition to WebRTC modal
            setActiveCall(call);
            setIncomingCall(null);
            setOutgoingCall(null);
            
            // Stop ringtones
            incomingRingtone.current?.stop();
            incomingRingtone.current = null;
            outgoingRingtone.current?.stop();
            outgoingRingtone.current = null;
          }
        }
      });

      if (!isUserInCall) {
        // Reset states if no call involving current user
        setIncomingCall(null);
        setOutgoingCall(null);
        setActiveCall(null);

        // Stop ringtones
        incomingRingtone.current?.stop();
        incomingRingtone.current = null;
        outgoingRingtone.current?.stop();
        outgoingRingtone.current = null;
      }
    });

    return () => {
      unsubscribe();
      incomingRingtone.current?.stop();
      outgoingRingtone.current?.stop();
    };
  }, [user]);

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    try {
      const callRef = doc(getFirebaseDb(), 'calls', incomingCall.callId);
      await updateDoc(callRef, {
        status: 'accepted',
        startTime: Date.now(),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectCall = async () => {
    if (!incomingCall) return;
    try {
      const callRef = doc(getFirebaseDb(), 'calls', incomingCall.callId);
      await updateDoc(callRef, {
        status: 'rejected',
        endTime: Date.now(),
      });
      // Delete the call document after updating
      setTimeout(async () => {
        await deleteDoc(callRef).catch(() => {});
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelCall = async () => {
    const call = outgoingCall || activeCall;
    if (!call) return;
    try {
      const callRef = doc(getFirebaseDb(), 'calls', call.callId);
      await updateDoc(callRef, {
        status: 'ended',
        endTime: Date.now(),
      });
      setTimeout(async () => {
        await deleteDoc(callRef).catch(() => {});
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* 📞 INCOMING CALL PROMPT OVERLAY */}
      {incomingCall && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 p-4 transition-all">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-bounce-short">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <Image
                src={incomingCall.callerPhoto || 'https://randomuser.me/api/portraits/men/1.jpg'}
                alt={incomingCall.callerName}
                fill
                className="rounded-full object-cover border-4 border-red-500"
              />
              <span className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-75" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {incomingCall.callerName}
            </h3>
            <p className="text-sm text-gray-500 mb-8">Incoming Video Call...</p>

            <div className="flex justify-center gap-6">
              <button
                onClick={handleAcceptCall}
                className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition duration-300"
                title="Accept Call"
              >
                <Check className="w-6 h-6" />
              </button>
              <button
                onClick={handleRejectCall}
                className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition duration-300"
                title="Reject Call"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📡 OUTGOING DIALING OVERLAY */}
      {outgoingCall && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 p-4 transition-all">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <Image
                src={outgoingCall.calleePhoto || 'https://randomuser.me/api/portraits/men/1.jpg'}
                alt={outgoingCall.calleeName}
                fill
                className="rounded-full object-cover border-4 border-blue-500"
              />
              <span className="absolute inset-0 rounded-full border-4 border-blue-500 animate-pulse" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {outgoingCall.calleeName}
            </h3>
            <p className="text-sm text-gray-500 mb-8 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              Calling...
            </p>

            <button
              onClick={handleCancelCall}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 mx-auto shadow-lg hover:scale-105 transition duration-300"
            >
              <PhoneOff className="w-4 h-4" /> Cancel Call
            </button>
          </div>
        </div>
      )}

      {/* 📺 ACTIVE VIDEO CALL WINDOW MODAL */}
      {activeCall && (
        <VideoCallModal call={activeCall} onHangUp={handleCancelCall} />
      )}
    </>
  );
}
