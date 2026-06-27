'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  storeOffer,
  storeAnswer,
  addCallerCandidate,
  addCalleeCandidate,
  subscribeCallerCandidates,
  subscribeCalleeCandidates,
  subscribeRoom,
  Room,
} from '@/lib/db/rooms';

// ── STUN configuration ────────────────────────────────────────────────────────
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  connectionState: string;
  mediaError: string | null;
  toggleMic: () => void;
  toggleCamera: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  cleanup: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useWebRTC(
  roomId: string,
  isCreator: boolean,
  isReady: boolean  // only start when room is confirmed active
): WebRTCState {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState('idle');
  const [mediaError, setMediaError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const offerCreatedRef = useRef(false);
  const answerCreatedRef = useRef(false);
  const unsubs = useRef<Array<() => void>>([]);

  // ── Acquire user media ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady) return;

    async function acquireMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setMediaError(null);
      } catch (err: any) {
        console.error('[WebRTC] getUserMedia error:', err);
        if (err.name === 'NotAllowedError') {
          setMediaError('Camera and microphone access was denied. Please allow access and refresh.');
        } else if (err.name === 'NotFoundError') {
          setMediaError('No camera or microphone found on this device.');
        } else {
          setMediaError('Could not access camera/microphone: ' + err.message);
        }
      }
    }

    acquireMedia();

    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [isReady]);

  // ── Build peer connection once we have media ───────────────────────────────
  useEffect(() => {
    if (!isReady || !localStream || !roomId) return;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    // Add local tracks
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    // Receive remote tracks
    const remoteMediaStream = new MediaStream();
    setRemoteStream(remoteMediaStream);
    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => remoteMediaStream.addTrack(track));
    };

    // Connection state
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      console.log('[WebRTC] Connection state:', pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', pc.iceConnectionState);
    };

    // ── CREATOR: watch for callee joining, then create offer ──────────────
    if (isCreator) {
      const unsubRoom = subscribeRoom(roomId, async (room: Room | null) => {
        if (!room || offerCreatedRef.current) return;
        const participantCount = Object.keys(room.participants || {}).length;

        if (participantCount >= 2) {
          offerCreatedRef.current = true;

          // Collect ICE candidates
          pc.onicecandidate = async (event) => {
            if (event.candidate) {
              await addCallerCandidate(roomId, event.candidate.toJSON());
            }
          };

          try {
            setConnectionState('connecting');
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await storeOffer(roomId, offer);
            console.log('[WebRTC] Creator stored offer');
          } catch (err) {
            console.error('[WebRTC] Error creating offer:', err);
          }
        }

        // Watch for callee's answer
        if (room.answer && pc.signalingState === 'have-local-offer') {
          try {
            const answer = new RTCSessionDescription({
              type: room.answer.type as RTCSdpType,
              sdp: room.answer.sdp,
            });
            await pc.setRemoteDescription(answer);
            console.log('[WebRTC] Creator set remote answer');
          } catch (err) {
            console.error('[WebRTC] Error setting answer:', err);
          }
        }
      });
      unsubs.current.push(unsubRoom);

      // Listen for callee's ICE candidates
      const unsubCandidates = subscribeCalleeCandidates(roomId, async (candidate) => {
        try {
          if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC] Error adding callee ICE:', err);
        }
      });
      unsubs.current.push(unsubCandidates);
    }

    // ── CALLEE: watch for offer, then create answer ───────────────────────
    if (!isCreator) {
      const unsubRoom = subscribeRoom(roomId, async (room: Room | null) => {
        if (!room || answerCreatedRef.current) return;
        if (!room.offer) return;

        answerCreatedRef.current = true;

        // Collect ICE candidates
        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            await addCalleeCandidate(roomId, event.candidate.toJSON());
          }
        };

        try {
          setConnectionState('connecting');
          const offer = new RTCSessionDescription({
            type: room.offer.type as RTCSdpType,
            sdp: room.offer.sdp,
          });
          await pc.setRemoteDescription(offer);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await storeAnswer(roomId, answer);
          console.log('[WebRTC] Callee stored answer');
        } catch (err) {
          console.error('[WebRTC] Error creating answer:', err);
        }
      });
      unsubs.current.push(unsubRoom);

      // Listen for caller's ICE candidates
      const unsubCandidates = subscribeCallerCandidates(roomId, async (candidate) => {
        try {
          if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC] Error adding caller ICE:', err);
        }
      });
      unsubs.current.push(unsubCandidates);
    }

    return () => {
      pc.close();
      pcRef.current = null;
      offerCreatedRef.current = false;
      answerCreatedRef.current = false;
      unsubs.current.forEach((u) => u());
      unsubs.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, localStream, roomId, isCreator]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMicEnabled(track.enabled);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsCameraEnabled(track.enabled);
    }
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = screenStream;
      const videoTrack = screenStream.getVideoTracks()[0];

      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(videoTrack);

      // Also update local preview
      const prevVideoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (prevVideoTrack && localStreamRef.current) {
        localStreamRef.current.removeTrack(prevVideoTrack);
        localStreamRef.current.addTrack(videoTrack);
      }
      setLocalStream(new MediaStream(localStreamRef.current?.getTracks() ?? []));
      setIsScreenSharing(true);

      videoTrack.onended = () => stopScreenShare();
    } catch (err) {
      console.error('[WebRTC] Screen share error:', err);
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    // Restore camera
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const camTrack = camStream.getVideoTracks()[0];
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(camTrack);

      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          t.stop();
          localStreamRef.current?.removeTrack(t);
        });
        localStreamRef.current.addTrack(camTrack);
      }
      setLocalStream(new MediaStream(localStreamRef.current?.getTracks() ?? []));
    } catch (err) {
      console.error('[WebRTC] Restore camera error:', err);
    }
    setIsScreenSharing(false);
  }, []);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    unsubs.current.forEach((u) => u());
    unsubs.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState('idle');
  }, []);

  return {
    localStream,
    remoteStream,
    isMicEnabled,
    isCameraEnabled,
    isScreenSharing,
    connectionState,
    mediaError,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    cleanup,
  };
}
