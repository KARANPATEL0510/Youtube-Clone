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
  isRecording: boolean;
  connectionState: string;
  mediaError: string | null;
  toggleMic: () => void;
  toggleCamera: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  startRecording: () => void;
  stopRecording: () => void;
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
  const [isRecording, setIsRecording] = useState(false);
  const [connectionState, setConnectionState] = useState('idle');
  const [mediaError, setMediaError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
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

  // ICE candidate queue — buffers candidates until remoteDescription is set
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  // Prevent concurrent renegotiation
  const isNegotiatingRef = useRef(false);

  // ── Build peer connection once we have media ───────────────────────────────
  useEffect(() => {
    if (!isReady || !localStream || !roomId) return;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;
    iceCandidateQueueRef.current = [];

    // Add local tracks
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    // ── Receive remote tracks (handles initial + screen-share replacements) ──
    const remoteMediaStream = new MediaStream();
    setRemoteStream(remoteMediaStream);

    pc.ontrack = (event) => {
      const incomingTrack = event.track;
      // Remove any existing track of the same kind before adding the new one
      remoteMediaStream.getTracks().forEach((existing) => {
        if (existing.kind === incomingTrack.kind) {
          remoteMediaStream.removeTrack(existing);
        }
      });
      remoteMediaStream.addTrack(incomingTrack);
      // Trigger React re-render so the remote video element picks up the change
      setRemoteStream(new MediaStream(remoteMediaStream.getTracks()));
    };

    // ── Connection state ───────────────────────────────────────────────────
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      console.log('[WebRTC] Connection state:', pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', pc.iceConnectionState);
    };

    // ── Helper: safely add ICE candidate (queue if remoteDescription not set) ──
    const safeAddCandidate = async (candidate: RTCIceCandidateInit) => {
      if (pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('[WebRTC] addIceCandidate error:', err);
        }
      } else {
        iceCandidateQueueRef.current.push(candidate);
      }
    };

    // ── Helper: drain queued ICE candidates after setRemoteDescription ─────
    const drainICEQueue = async () => {
      const queue = [...iceCandidateQueueRef.current];
      iceCandidateQueueRef.current = [];
      for (const c of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        } catch (err) {
          console.warn('[WebRTC] Drain candidate error:', err);
        }
      }
    };

    // ── CREATOR side ───────────────────────────────────────────────────────
    if (isCreator) {
      // ICE collection for creator
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await addCallerCandidate(roomId, event.candidate.toJSON());
        }
      };

      // Renegotiation (fires when screen share replaces a track)
      pc.onnegotiationneeded = async () => {
        if (isNegotiatingRef.current) return;
        isNegotiatingRef.current = true;
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await storeOffer(roomId, offer);
          console.log('[WebRTC] Creator renegotiated offer');
        } catch (err) {
          console.error('[WebRTC] Renegotiation error:', err);
        } finally {
          isNegotiatingRef.current = false;
        }
      };

      const unsubRoom = subscribeRoom(roomId, async (room: Room | null) => {
        if (!room) return;
        const participantCount = Object.keys(room.participants || {}).length;

        // Create initial offer when callee joins
        if (participantCount >= 2 && !offerCreatedRef.current) {
          offerCreatedRef.current = true;
          try {
            setConnectionState('connecting');
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await storeOffer(roomId, offer);
            console.log('[WebRTC] Creator stored initial offer');
          } catch (err) {
            console.error('[WebRTC] Error creating initial offer:', err);
          }
        }

        // Accept callee's answer
        if (room.answer && pc.signalingState === 'have-local-offer') {
          try {
            await pc.setRemoteDescription(
              new RTCSessionDescription({ type: room.answer.type as RTCSdpType, sdp: room.answer.sdp })
            );
            await drainICEQueue();
            console.log('[WebRTC] Creator set remote answer');
          } catch (err) {
            console.error('[WebRTC] Error setting answer:', err);
          }
        }
      });
      unsubs.current.push(unsubRoom);

      // Receive callee's ICE candidates
      const unsubCandidates = subscribeCalleeCandidates(roomId, async (candidate) => {
        await safeAddCandidate(candidate);
      });
      unsubs.current.push(unsubCandidates);
    }

    // ── CALLEE side ───────────────────────────────────────────────────────
    if (!isCreator) {
      // ICE collection for callee
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await addCalleeCandidate(roomId, event.candidate.toJSON());
        }
      };

      const unsubRoom = subscribeRoom(roomId, async (room: Room | null) => {
        if (!room || !room.offer) return;

        // Handle new offer (initial connection or renegotiation from creator)
        const offerSdp = room.offer.sdp;
        const currentRemote = pc.remoteDescription?.sdp;

        if (offerSdp !== currentRemote) {
          try {
            setConnectionState('connecting');
            await pc.setRemoteDescription(
              new RTCSessionDescription({ type: room.offer.type as RTCSdpType, sdp: room.offer.sdp })
            );
            await drainICEQueue();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await storeAnswer(roomId, answer);
            console.log('[WebRTC] Callee answered offer');
          } catch (err) {
            console.error('[WebRTC] Error creating answer:', err);
          }
        }
      });
      unsubs.current.push(unsubRoom);

      // Receive caller's ICE candidates
      const unsubCandidates = subscribeCallerCandidates(roomId, async (candidate) => {
        await safeAddCandidate(candidate);
      });
      unsubs.current.push(unsubCandidates);
    }

    return () => {
      pc.close();
      pcRef.current = null;
      offerCreatedRef.current = false;
      answerCreatedRef.current = false;
      isNegotiatingRef.current = false;
      iceCandidateQueueRef.current = [];
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

  // ── Recording ─────────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) {
      console.warn('[Recording] No local stream available yet.');
      return;
    }
    if (mediaRecorderRef.current?.state === 'recording') return;

    // Pick the best supported MIME type
    const mimeType = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ].find((m) => MediaRecorder.isTypeSupported(m)) ?? '';

    recordedChunksRef.current = [];
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType || 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
      a.href = url;
      a.download = `call-recording-${timestamp}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      recordedChunksRef.current = [];
      console.log('[Recording] ✅ Recording saved to device');
    };

    recorder.start(1000); // collect a chunk every second
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    console.log('[Recording] 🔴 Recording started');
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
    console.log('[Recording] ⏹ Recording stopped');
  }, []);

  const cleanup = useCallback(() => {
    // Stop recording if active
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    unsubs.current.forEach((u) => u());
    unsubs.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setIsRecording(false);
    setConnectionState('idle');
  }, []);

  return {
    localStream,
    remoteStream,
    isMicEnabled,
    isCameraEnabled,
    isScreenSharing,
    isRecording,
    connectionState,
    mediaError,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    startRecording,
    stopRecording,
    cleanup,
  };
}
