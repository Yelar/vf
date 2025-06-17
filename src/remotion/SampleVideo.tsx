import React, { useRef, useEffect } from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  delayRender,
  continueRender,
} from 'remotion';

interface SampleVideoProps {
  titleText: string;
  subtitleText: string;
  backgroundVideo?: string | null;
}

export const SampleVideo: React.FC<SampleVideoProps> = ({
  titleText,
  subtitleText,
  backgroundVideo,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackHandle = useRef<number | undefined>(undefined);

  // Sync background video with Remotion timeline - OPTIMIZED FOR SMOOTHNESS
  useEffect(() => {
    if (videoRef.current && backgroundVideo) {
      const video = videoRef.current;
      const currentTime = frame / fps;
      
      // Handle video playback
      playbackHandle.current = delayRender("Syncing background video playback state");
      
      const handlePause = () => {
        video.pause();
        if (playbackHandle.current) {
          continueRender(playbackHandle.current);
        }
      };

      const handlePlay = () => {
        video.play().catch(() => {
          // Ignore play errors in preview
        });
        if (playbackHandle.current) {
          continueRender(playbackHandle.current);
        }
      };

      video.addEventListener('pause', handlePause);
      video.addEventListener('play', handlePlay);
      
      // Much less frequent updates - only sync every 0.5 seconds of difference
      if (Math.abs(video.currentTime - currentTime) > 0.5) {
        video.currentTime = currentTime % (video.duration || 5);
      }

      return () => {
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('play', handlePlay);
        if (playbackHandle.current) {
          continueRender(playbackHandle.current);
        }
      };
    }
  }, [Math.floor(frame / 30), backgroundVideo, fps, frame]); // Added fps and frame to dependencies

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(frame, [0, 30], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scale = interpolate(
    frame,
    [0, 30, durationInFrames - 30, durationInFrames],
    [0.8, 1, 1, 1.1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const backgroundOpacity = interpolate(
    frame,
    [0, 30, durationInFrames - 30, durationInFrames],
    [0.2, 0.8, 0.8, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill
      style={{
        background: backgroundVideo 
          ? 'transparent' 
          : `linear-gradient(135deg, rgba(59, 130, 246, ${backgroundOpacity}), rgba(147, 51, 234, ${backgroundOpacity}))`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Background Video - OPTIMIZED FOR PERFORMANCE */}
      {backgroundVideo && (
        <video
          ref={videoRef}
          src={backgroundVideo}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: -1,
            willChange: 'auto',
            transform: 'translateZ(0)', // Hardware acceleration
          }}
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => {
            // Start video immediately when loaded for smoother experience
            if (videoRef.current) {
              videoRef.current.play().catch(() => {
                // Ignore play errors in preview
              });
            }
          }}
        />
      )}
      
      {/* Dark overlay for text readability when video is present */}
      {backgroundVideo && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.2)',
            zIndex: 0,
          }}
        />
      )}
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px) scale(${scale})`,
          textAlign: 'center',
          color: 'white',
        }}
      >
        <h1
          style={{
            fontSize: 100,
            fontWeight: 'bold',
            margin: 0,
            marginBottom: 20,
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          {titleText}
        </h1>
        <p
          style={{
            fontSize: 40,
            margin: 0,
            opacity: 0.9,
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {subtitleText}
        </p>
      </div>
      
      {/* Animated particles - only show when no background video - OPTIMIZED */}
      {!backgroundVideo && Array.from({length: 6}).map((_, i) => {
        const particleFrame = (frame + i * 10) % 90; // Slower animation
        const particleOpacity = interpolate(particleFrame, [0, 45, 90], [0, 0.6, 0]);
        const particleY = interpolate(particleFrame, [0, 90], [80, -80]);
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 3,
              height: 3,
              backgroundColor: 'white',
              borderRadius: '50%',
              left: `${15 + i * 12}%`,
              top: '50%',
              transform: `translateY(${particleY}px) translateZ(0)`, // Hardware acceleration
              opacity: particleOpacity,
              willChange: 'transform',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}; 