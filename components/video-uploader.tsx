"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Eye,
  Lock,
  ChevronDown,
  Plus,
  ListPlus,
  Globe
} from "lucide-react";
import Image from "next/image";

interface VideoMetadata {
  title: string;
  description: string;
  visibility: "public" | "unlisted" | "private";
  category: string;
  tags: string[];
  language: string;
  madeForKids: boolean;
  allowComments: boolean;
  allowRatings: boolean;
  playlist?: string;
}

interface Playlist {
  id: string;
  name: string;
  videoCount: number;
}

interface VideoUploaderProps {
  channelId?: string;
  onUploadComplete?: (videoId: string) => void;
  onClose?: () => void;
  maxSize?: number;
  existingPlaylists?: Playlist[];
  onCreatePlaylist?: (name: string, visibility: "public" | "private") => void;
}

const categories = [
  "Music", "Gaming", "Education", "Entertainment", "Sports", 
  "Technology", "Comedy", "News", "How-to & Style", "Science & Technology"
];

const languages = ["English", "Hindi", "Spanish", "French", "German", "Japanese", "Korean"];

const VideoUploader = ({ 
  channelId,
  onUploadComplete, 
  onClose,
  maxSize = 100,
  existingPlaylists = [],
  onCreatePlaylist
}: VideoUploaderProps) => {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "details" | "processing" | "complete">("upload");
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>("Uploading...");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("");
  const [playlists, setPlaylists] = useState<Playlist[]>(existingPlaylists);
  
  const [metadata, setMetadata] = useState<VideoMetadata>({
    title: "",
    description: "",
    visibility: "public",
    category: "Education",
    tags: [],
    language: "English",
    madeForKids: false,
    allowComments: true,
    allowRatings: true,
    playlist: "",
  });
  
  const [tagInput, setTagInput] = useState("");
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);

  // Generate thumbnail from video
  const generateThumbnail = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      if (context) {
        // Set canvas dimensions to match video aspect ratio
        canvas.width = 320;
        canvas.height = 180;
        
        // Seek to 1 second into the video for thumbnail
        video.currentTime = 1;
        
        video.onseeked = () => {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailDataUrl = canvas.toDataURL("image/jpeg");
          setVideoThumbnail(thumbnailDataUrl);
          video.onseeked = null;
        };
      }
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      validateAndSetFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`File too large. Maximum size is ${maxSize}MB.`);
      return;
    }
    
    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);
    setStep("details");
  };

  const handleRemoveFile = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setSelectedFile(null);
    setVideoPreview(null);
    setVideoThumbnail(null);
    setStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !metadata.tags.includes(tagInput.trim())) {
      setMetadata({
        ...metadata,
        tags: [...metadata.tags, tagInput.trim()]
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setMetadata({
      ...metadata,
      tags: metadata.tags.filter(t => t !== tag)
    });
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      videoCount: 0,
    };
    
    setPlaylists([newPlaylist, ...playlists]);
    setSelectedPlaylist(newPlaylist.id);
    setMetadata({ ...metadata, playlist: newPlaylist.id });
    if (onCreatePlaylist) {
      onCreatePlaylist(newPlaylistName, "public");
    }
    setNewPlaylistName("");
    setShowCreatePlaylist(false);
  };

  const handleAddToPlaylist = (playlistId: string) => {
    setSelectedPlaylist(playlistId);
    setMetadata({ ...metadata, playlist: playlistId });
    setShowAddToPlaylist(false);
  };

  const handleUpload = async () => {
    if (!metadata.title.trim()) {
      setError("Please enter a title for your video.");
      return;
    }
    if (!selectedFile) {
      setError("No video file selected.");
      return;
    }
    if (!channelId) {
      setError("No channel found. Please create a channel first.");
      return;
    }

    // Generate thumbnail from video frame if not already done
    if (!videoThumbnail && videoRef.current) {
      generateThumbnail();
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    setStep("processing");
    setUploadProgress(0);

    try {
      // ── Step 1: Upload video file ───────────────────────────────────────────
      const isNonNative = /\.(mov|avi|mkv|flv)$/i.test(selectedFile.name);
      setProcessingStatus(
        isNonNative
          ? `Converting ${selectedFile.name.split(".").pop()?.toUpperCase()} → MP4 (this may take a moment)…`
          : "Uploading video…"
      );
      setUploadProgress(10);

      const videoForm = new FormData();
      videoForm.append("file", selectedFile);
      videoForm.append("userId", channelId);
      videoForm.append("fileType", "video");

      const videoRes = await fetch("/api/upload", { method: "POST", body: videoForm });
      if (!videoRes.ok) {
        const err = await videoRes.json();
        throw new Error(err.error || "Video upload failed");
      }
      const { url: videoUrl } = await videoRes.json();
      setUploadProgress(60);

      // ── Step 2: Upload thumbnail ────────────────────────────────────────────
      let thumbnailUrl = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400";
      setProcessingStatus("Uploading thumbnail…");

      const thumbDataUrl = videoThumbnail || null;
      if (thumbDataUrl) {
        // Convert base64 data URL → Blob → File
        const base64Data = thumbDataUrl.split(",")[1];
        const byteChars = atob(base64Data);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        const thumbBlob = new Blob([byteArr], { type: "image/jpeg" });
        const thumbFile = new File([thumbBlob], "thumbnail.jpg", { type: "image/jpeg" });

        const thumbForm = new FormData();
        thumbForm.append("file", thumbFile);
        thumbForm.append("userId", channelId);
        thumbForm.append("fileType", "thumbnail");

        const thumbRes = await fetch("/api/upload", { method: "POST", body: thumbForm });
        if (thumbRes.ok) {
          const { url } = await thumbRes.json();
          thumbnailUrl = url;
        }
      }
      setUploadProgress(80);

      // ── Step 3: Save metadata to MongoDB ───────────────────────────────────
      setProcessingStatus("Saving video details…");
      const metaRes = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: channelId,
          title: metadata.title,
          description: metadata.description,
          videoUrl,
          thumbnailUrl,
          category: metadata.category,
          visibility: metadata.visibility,
        }),
      });

      if (!metaRes.ok) {
        const err = await metaRes.json();
        throw new Error(err.error || "Failed to save video metadata");
      }
      const savedVideo = await metaRes.json();
      const newVideoId = savedVideo._id || savedVideo.id;

      setUploadProgress(100);
      setProcessingStatus("Upload complete!");
      setUploadedVideoId(newVideoId);
      setStep("complete");

      if (onUploadComplete) onUploadComplete(newVideoId);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(msg);
      setStep("details");
    }
  };

  const handleViewVideo = () => {
    if (onClose) onClose();
    if (uploadedVideoId) {
      router.push(`/watch/${uploadedVideoId}`);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const visibilityOptions = {
    public: { icon: Globe, label: "Public", description: "Anyone can watch this video" },
    unlisted: { icon: LinkIcon, label: "Unlisted", description: "Anyone with the link can watch" },
    private: { icon: Lock, label: "Private", description: "Only you can watch" },
  };

  if (step === "upload") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl mx-4 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold">Upload a video</h2>
            {onClose && (
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div
            className={`m-6 border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-500"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-10 h-10 text-gray-500" />
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Drag and drop video file</h3>
            <p className="text-sm text-gray-500 mb-2">or click to select files</p>
            <p className="text-xs text-gray-400">MP4, WebM, MOV, AVI, MKV • Up to {maxSize}MB</p>
            <p className="text-xs text-green-600 mt-1">MOV, AVI &amp; MKV are auto-converted to MP4 ✓</p>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === "details") {
    const selectedPlaylistObj = playlists.find(p => p.id === selectedPlaylist);
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl mx-4 overflow-hidden shadow-2xl">
          {/* Hidden canvas for thumbnail generation */}
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">Video details</h2>
            <button onClick={handleRemoveFile} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="flex gap-6 flex-col md:flex-row">
              <div className="md:w-80 flex-shrink-0">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
                  {videoPreview && (
                    <>
                      <video
                        ref={videoRef}
                        src={videoPreview}
                        className="w-full h-full object-contain"
                        onLoadedData={generateThumbnail}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button onClick={togglePlayPause} className="p-2 bg-white/20 rounded-full">
                          {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                        </button>
                        <button onClick={toggleMute} className="p-2 bg-white/20 rounded-full">
                          {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {selectedFile?.name} ({(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={metadata.title}
                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                    placeholder="Add a title that describes your video"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={metadata.description}
                    onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                    placeholder="Tell viewers about your video"
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Add to playlist</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowAddToPlaylist(!showAddToPlaylist)}
                      className="w-full flex items-center justify-between px-3 py-2 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <ListPlus className="w-4 h-4" />
                        <span>{selectedPlaylistObj ? selectedPlaylistObj.name : "Select a playlist (optional)"}</span>
                      </div>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {showAddToPlaylist && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowAddToPlaylist(false)} />
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                          <button
                            onClick={() => { setSelectedPlaylist(""); setMetadata({ ...metadata, playlist: "" }); setShowAddToPlaylist(false); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" /> None
                          </button>
                          {playlists.map((playlist) => (
                            <button
                              key={playlist.id}
                              onClick={() => handleAddToPlaylist(playlist.id)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                            >
                              <span>{playlist.name}</span>
                              <span className="text-xs text-gray-400">{playlist.videoCount} videos</span>
                            </button>
                          ))}
                          <button
                            onClick={() => { setShowAddToPlaylist(false); setShowCreatePlaylist(true); }}
                            className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" /> Create new playlist
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {showCreatePlaylist && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                      <h3 className="text-lg font-semibold mb-4">New playlist</h3>
                      <input
                        type="text"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder="Playlist name"
                        className="w-full px-3 py-2 border rounded-lg mb-4 focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <div className="flex gap-3 justify-end">
                        <button onClick={() => setShowCreatePlaylist(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                        <button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">Create</button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">Visibility</label>
                  <div className="relative">
                    <button onClick={() => setShowVisibilityMenu(!showVisibilityMenu)} className="w-full flex items-center justify-between px-3 py-2 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {metadata.visibility === "public" && <Globe className="w-4 h-4" />}
                        {metadata.visibility === "private" && <Lock className="w-4 h-4" />}
                        <span>{metadata.visibility.charAt(0).toUpperCase() + metadata.visibility.slice(1)}</span>
                      </div>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showVisibilityMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowVisibilityMenu(false)} />
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-20">
                          {Object.entries(visibilityOptions).map(([key, { icon: Icon, label, description }]) => (
                            <button
                              key={key}
                              onClick={() => { setMetadata({ ...metadata, visibility: key as any }); setShowVisibilityMenu(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                            >
                              <Icon className="w-4 h-4" />
                              <div className="text-left"><p className="text-sm font-medium">{label}</p><p className="text-xs text-gray-500">{description}</p></div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={handleRemoveFile} className="px-4 py-2 border rounded-full">Cancel</button>
              <button onClick={handleUpload} disabled={!metadata.title.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-full disabled:opacity-50">Upload video</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            {uploadProgress < 100 ? (
              <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-16 h-16 text-green-500" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {uploadProgress < 100 ? processingStatus : "Upload complete!"}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {uploadProgress < 100
              ? `Progress: ${uploadProgress}%`
              : "Your video has been successfully uploaded and is ready to play"}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
          </div>
          {uploadProgress === 100 && (
            <div className="flex gap-3 justify-center">
              <button onClick={handleViewVideo} className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
                Watch now
              </button>
              {onClose && (
                <button onClick={onClose} className="px-6 py-2 border rounded-full hover:bg-gray-50 transition">
                  Close
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

const LinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export default VideoUploader;