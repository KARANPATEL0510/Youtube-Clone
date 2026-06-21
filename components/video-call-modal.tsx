'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { getFirebaseDb } from '@/lib/firebase';
import {
  doc,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import {
  Mic,
  MicOff,
  Video as Cam,
  VideoOff,
  Monitor,
  Video,
  Radio,
  Square,
  Circle,
  PhoneOff,
  AlertTriangle,
} from 'lucide-react';

interface VideoCallModalProps {
  call: {
    callId: string;
    callerId: string;
    callerName: string;
    calleeId: string;
    calleeName: string;
    status: string;
  };
  onHangUp: () => void;
}

const servers = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

export default function VideoCallModal({ call, onHangUp }: VideoCallModalProps) {
  const { user } = useAuth();
  const isCaller = call.callerId === user?.uid;

  // Streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // States
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunks = useRef<Blob[]>([]);
  const animationFrameId = useRef<number | null>(null);

  // Initialize WebRTC
  useEffect(() => {
    let active = true;

    async function initWebRTC() {
      try {
        // 1. Get local stream
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: true,
          });
        } catch (mediaErr) {
          console.warn('Failed with normal camera options, retrying fallback...', mediaErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        }

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Setup Peer Connection
        const pc = new RTCPeerConnection(servers);
        pcRef.current = pc;

        // Push local tracks
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Set remote video on track arrival
        const rStream = new MediaStream();
        setRemoteStream(rStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = rStream;
        }

        pc.ontrack = (event) => {
          event.streams[0].getTracks().forEach((track) => {
            rStream.addTrack(track);
          });
        };

        // Listen for remote end call state via database
        const callDocRef = doc(getFirebaseDb(), 'calls', call.callId);
        const unsubCall = onSnapshot(callDocRef, (snap) => {
          if (!snap.exists()) {
            onHangUp();
            return;
          }
          const callData = snap.data();
          if (callData.status === 'ended' || callData.status === 'rejected') {
            onHangUp();
          }
        });

        // 3. ICE Candidate exchange
        const candidatesCol = collection(getFirebaseDb(), 'calls', call.callId, 'iceCandidates');

        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            await addDoc(candidatesCol, {
              ...event.candidate.toJSON(),
              type: isCaller ? 'caller' : 'callee',
            });
          }
        };

        // Listen to remote ICE Candidates
        const unsubCandidates = onSnapshot(candidatesCol, (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              // Only add candidate if it is from the opposite side
              if (data.type !== (isCaller ? 'caller' : 'callee')) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(data as any));
                } catch (e) {
                  console.warn('Error adding ICE candidate:', e);
                }
              }
            }
          });
        });

        // 4. Offer / Answer handshake
        if (isCaller) {
          // Caller creates Offer
          const offerDescription = await pc.createOffer();
          await pc.setLocalDescription(offerDescription);

          await updateDoc(callDocRef, {
            offer: {
              type: offerDescription.type,
              sdp: offerDescription.sdp,
            },
          });

          // Listen for Answer
          const unsubAnswer = onSnapshot(callDocRef, async (snapshot) => {
            const data = snapshot.data();
            if (data?.answer && !pc.currentRemoteDescription) {
              const answerDesc = new RTCSessionDescription(data.answer);
              await pc.setRemoteDescription(answerDesc);
            }
          });

          return () => {
            unsubAnswer();
            unsubCandidates();
            unsubCall();
          };
        } else {
          // Callee receives Offer, sets it, creates Answer
          const offerDesc = await getDocOffer(call.callId);
          if (offerDesc) {
            await pc.setRemoteDescription(new RTCSessionDescription(offerDesc));

            const answerDescription = await pc.createAnswer();
            await pc.setLocalDescription(answerDescription);

            await updateDoc(callDocRef, {
              answer: {
                type: answerDescription.type,
                sdp: answerDescription.sdp,
              },
            });
          }

          return () => {
            unsubCandidates();
            unsubCall();
          };
        }
      } catch (err: any) {
        console.error('WebRTC initialization failed:', err);
        setPermissionError(err.message || 'Permission denied for camera/microphone.');
      }
    }

    let cleanupPromise = initWebRTC();

    return () => {
      active = false;
      cleanupPromise.then((cleanup) => {
        if (cleanup) cleanup();
      });
      // Cleanup streams
      localStream?.getTracks().forEach((track) => track.stop());
      remoteStream?.getTracks().forEach((track) => track.stop());
      screenStream?.getTracks().forEach((track) => track.stop());
      if (pcRef.current) pcRef.current.close();
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      mediaRecorderRef.current?.stop();
    };
  }, []);

  // Callee helper to read offer
  const getDocOffer = async (callId: string) => {
    return new Promise<any>((resolve) => {
      const docRef = doc(getFirebaseDb(), 'calls', callId);
      const unsub = onSnapshot(docRef, (snap) => {
        const data = snap.data();
        if (data?.offer) {
          unsub();
          resolve(data.offer);
        }
      });
    });
  };

  // Toggle Controls
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCamOff(!isCamOff);
    }
  };

  // Screen Sharing
  const handleStartScreenShare = async (requireTabForYoutube: boolean) => {
    try {
      if (isScreenSharing) {
        // Stop current share
        if (screenStream) {
          screenStream.getTracks().forEach((t) => t.stop());
          setScreenStream(null);
        }
        // Restore camera
        if (localStream && pcRef.current) {
          const videoTrack = localStream.getVideoTracks()[0];
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) await sender.replaceTrack(videoTrack);
          if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
        }
        setIsScreenSharing(false);
        return;
      }

      // Prompt screen sharing
      const options: DisplayMediaStreamOptions = {
        video: {
          displaySurface: requireTabForYoutube ? 'browser' : 'monitor',
        },
        audio: true, // share tab audio for YouTube
      };

      const sStream = await navigator.mediaDevices.getDisplayMedia(options);
      setScreenStream(sStream);
      setIsScreenSharing(true);

      const screenVideoTrack = sStream.getVideoTracks()[0];

      // Replace WebRTC sender track
      if (pcRef.current) {
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(screenVideoTrack);
      }

      // Show locally
      if (localVideoRef.current) localVideoRef.current.srcObject = sStream;

      // Handle user stopping screen share from browser overlay
      screenVideoTrack.onended = async () => {
        sStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
        setIsScreenSharing(false);
        if (localStream && pcRef.current) {
          const videoTrack = localStream.getVideoTracks()[0];
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) await sender.replaceTrack(videoTrack);
          if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
        }
      };
    } catch (err) {
      console.error('Error starting screen share:', err);
    }
  };

  // Call Recording (Combines local/remote video on Canvas + Audio Mixing via Web Audio API)
  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop Recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);

      // Save recording metadata to database
      try {
        const callDocRef = doc(getFirebaseDb(), 'calls', call.callId);
        await updateDoc(callDocRef, {
          recordingStatus: 'recorded',
        });
      } catch (err) {
        console.error(err);
      }
      return;
    }

    // Start Recording
    try {
      recordingChunks.current = [];

      // Create hidden canvas if not already created
      if (!canvasRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        canvasRef.current = canvas;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;

      // Video elements
      const remoteVideo = remoteVideoRef.current;
      const localVideo = localVideoRef.current;

      const drawFrame = () => {
        if (!remoteVideo || !localVideo) return;

        // Draw Remote stream full screen
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (remoteVideo.readyState >= 2) {
          ctx.drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
        }

        // Draw Local stream picture-in-picture in bottom right corner
        if (localVideo.readyState >= 2) {
          const pipWidth = 320;
          const pipHeight = 180;
          const pipX = canvas.width - pipWidth - 30;
          const pipY = canvas.height - pipHeight - 30;

          // Border / Card shadow simulation
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillRect(pipX - 4, pipY - 4, pipWidth + 8, pipHeight + 8);
          ctx.drawImage(localVideo, pipX, pipY, pipWidth, pipHeight);
        }

        animationFrameId.current = requestAnimationFrame(drawFrame);
      };

      // Start drawing frames
      drawFrame();

      // Capture canvas video stream
      const canvasStream = canvas.captureStream(30);

      // Mix Audio from both local and remote streams
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const destNode = audioCtx.createMediaStreamDestination();

      if (localStream && localStream.getAudioTracks().length > 0) {
        const localSource = audioCtx.createMediaStreamSource(
          new MediaStream([localStream.getAudioTracks()[0]])
        );
        localSource.connect(destNode);
      }

      if (remoteStream && remoteStream.getAudioTracks().length > 0) {
        const remoteSource = audioCtx.createMediaStreamSource(
          new MediaStream([remoteStream.getAudioTracks()[0]])
        );
        remoteSource.connect(destNode);
      }

      // Combine video from canvas and mixed audio into a single stream
      const mixedTracks = [
        canvasStream.getVideoTracks()[0],
        ...destNode.stream.getAudioTracks(),
      ];
      const mixedStream = new MediaStream(mixedTracks);

      // Setup MediaRecorder
      let options = { mimeType: 'video/webm;codecs=vp9,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
      }

      const recorder = new MediaRecorder(mixedStream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordingChunks.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordingChunks.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        // Auto Download locally
        const a = document.createElement('a');
        a.href = url;
        a.download = `youtube-clone-call-${call.callId}-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      recorder.start(1000); // chunk size 1s
      setIsRecording(true);

      // Update call metadata in database
      const callDocRef = doc(getFirebaseDb(), 'calls', call.callId);
      await updateDoc(callDocRef, {
        recordingStatus: 'recording',
      });
    } catch (e) {
      console.error('Recording failed:', e);
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between select-none animate-in fade-in duration-300">
      {/* ── HEADER OVERLAY ── */}
      <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white">
            <Video className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-white font-bold tracking-wide">
              {isCaller ? call.calleeName : call.callerName}
            </h2>
            <p className="text-xs text-gray-400">Secure Peer-to-Peer Call</p>
          </div>
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 bg-red-600/30 border border-red-500/50 px-3 py-1.5 rounded-full text-red-500 font-bold text-xs animate-pulse">
            <Radio className="w-4 h-4" />
            <span>REC</span>
          </div>
        )}
      </div>

      {/* ── VIDEO DISPLAY AREA ── */}
      <div className="flex-1 relative bg-neutral-950 flex items-center justify-center overflow-hidden">
        {permissionError ? (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4 animate-pulse" />
            <h3 className="text-white text-lg font-bold mb-2">Camera / Mic Access Denied</h3>
            <p className="text-gray-400 text-sm mb-6">{permissionError}</p>
            <button
              onClick={onHangUp}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition"
            >
              Close Window
            </button>
          </div>
        ) : (
          <>
            {/* Main Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              poster="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop"
            />

            {/* PIP Local Video */}
            <div className="absolute bottom-28 right-6 w-48 h-32 md:w-64 md:h-44 bg-neutral-900 border-2 border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10 hover:scale-105 transition-transform duration-300">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]" // mirrors the local stream
              />
              <span className="absolute bottom-2 left-3 text-[10px] bg-black/60 text-white/95 px-2 py-0.5 rounded-full">
                You
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── GLASSMORPHIC CONTROL BAR ── */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/95 to-transparent flex flex-col items-center gap-4 z-20">
        <div className="flex items-center gap-4 bg-white/10 dark:bg-black/40 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 shadow-2xl">
          {/* Mute Mic */}
          <button
            onClick={toggleMute}
            className={`p-3.5 rounded-2xl transition flex items-center justify-center hover:scale-110 duration-200 ${
              isMuted
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white/15 dark:bg-neutral-800 text-white hover:bg-white/25'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Camera */}
          <button
            onClick={toggleCamera}
            className={`p-3.5 rounded-2xl transition flex items-center justify-center hover:scale-110 duration-200 ${
              isCamOff
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white/15 dark:bg-neutral-800 text-white hover:bg-white/25'
            }`}
            title={isCamOff ? 'Turn Cam On' : 'Turn Cam Off'}
          >
            {isCamOff ? <VideoOff className="w-5 h-5" /> : <Cam className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={() => handleStartScreenShare(false)}
            className={`p-3.5 rounded-2xl transition flex items-center justify-center hover:scale-110 duration-200 ${
              isScreenSharing
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/15 dark:bg-neutral-800 text-white hover:bg-white/25'
            }`}
            title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* YouTube Tab Share */}
          <button
            onClick={() => handleStartScreenShare(true)}
            className="p-3.5 bg-red-600/20 text-red-500 hover:bg-red-600/35 hover:scale-110 border border-red-500/20 rounded-2xl transition flex items-center justify-center duration-200"
            title="Share YouTube Browser Tab"
          >
            <Video className="w-5 h-5" />
          </button>

          {/* Record Call */}
          <button
            onClick={handleToggleRecording}
            className={`p-3.5 rounded-2xl transition flex items-center justify-center hover:scale-110 duration-200 ${
              isRecording
                ? 'bg-red-600 text-white shadow-lg animate-pulse'
                : 'bg-white/15 dark:bg-neutral-800 text-white hover:bg-white/25'
            }`}
            title={isRecording ? 'Stop Recording' : 'Record Call'}
          >
            {isRecording ? <Square className="w-5 h-5" /> : <Circle className="w-5 h-5 fill-white" />}
          </button>

          {/* Hang Up */}
          <button
            onClick={onHangUp}
            className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-125 transition duration-300 ml-4"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
