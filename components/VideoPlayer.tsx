import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  onTimeUpdate: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
}

export interface VideoPlayerRef {
  videoElement: HTMLVideoElement | null;
  seekTo: (time: number) => void;
  captureFrame: () => string | null;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ src, onTimeUpdate, onDurationChange }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({
    videoElement: videoRef.current,
    seekTo: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    captureFrame: () => {
      if (!videoRef.current) return null;
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        // Use JPEG for smaller size suitable for API
        return canvas.toDataURL('image/jpeg', 0.8); 
      }
      return null;
    }
  }));

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && onDurationChange) {
      onDurationChange(videoRef.current.duration);
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden rounded-lg shadow-2xl border border-gray-800">
      <video
        ref={videoRef}
        src={src}
        className="max-h-full max-w-full object-contain"
        controls
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
