import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  Video,
} from 'remotion';

interface SampleVideoProps {
  speechText: string;
  backgroundVideo?: string | null;
  audioSrc?: string | null;
  audioDuration?: number | null;
}

export const SampleVideo: React.FC<SampleVideoProps> = ({
  speechText,
  backgroundVideo,
  audioSrc,
  audioDuration,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  
  // Simplified approach for smooth video playback

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
      {/* Audio Track */}
      {audioSrc && (
        <Audio src={audioSrc} />
      )}

      {/* Background Video - OPTIMIZED FOR SEAMLESS PLAYBACK */}
      {backgroundVideo && (
        <Video
          src={backgroundVideo}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: -1,
            transform: 'scale(1.05)', // Slight zoom for better mobile fit
            filter: 'brightness(0.8)', // Slightly darken for text readability
          }}
          muted
          playbackRate={1}
          loop
        />
      )}
      
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px) scale(${scale})`,
          textAlign: 'center',
          color: 'white',
          padding: '60px 40px',
          maxWidth: '95%',
          zIndex: 10,
          position: 'relative',
        }}
      >
        {/* Word-by-word text display - High Quality YouTube Shorts */}
        <div
          style={{
            fontSize: 68, // Slightly larger for better quality
            fontWeight: '900', // Maximum boldness
            margin: 0,
            lineHeight: 1.2,
            textShadow: '0 0 30px rgba(0,0,0,0.8), 4px 4px 12px rgba(0,0,0,0.9), -2px -2px 8px rgba(0,0,0,0.6)',
            wordWrap: 'break-word',
            hyphens: 'auto',
            fontFamily: 'Impact, "Arial Black", Helvetica, sans-serif',
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased',
          }}
        >
          {(() => {
            if (!speechText) return '';
            
            const words = speechText.split(' ');
            const currentTime = frame / fps;
            const totalDuration = audioDuration || (durationInFrames / fps);
            
            // Calculate words per second with natural speech pacing
            const adjustedDuration = Math.max(totalDuration * 0.95, 3); // Use 95% for natural pacing
            const wordsPerSecond = words.length / adjustedDuration;
            const currentWordIndex = Math.floor(currentTime * wordsPerSecond);
            
            // Show ONLY the current word - ONE WORD AT A TIME
            if (currentWordIndex >= 0 && currentWordIndex < words.length) {
              const currentWord = words[currentWordIndex];
              
              return (
                <>
                  <span
                    style={{
                      color: '#FFD700', // Gold color for the current word
                      display: 'inline-block',
                      transform: 'scale(1.1)',
                      textShadow: '0 0 15px rgba(255, 215, 0, 0.6), 3px 3px 6px rgba(0,0,0,0.8)',
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    {currentWord}
                  </span>
                  
                  {/* Blinking cursor after the word */}
                  <span
                    style={{
                      opacity: Math.sin(frame * 0.5) > 0 ? 1 : 0.3,
                      color: '#FFD700',
                      marginLeft: '0.2em',
                      fontSize: '0.9em',
                    }}
                  >
                    |
                  </span>
                </>
              );
            }
            
            return '';
          })()}
        </div>
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