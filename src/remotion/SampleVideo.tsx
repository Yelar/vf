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
  bgMusic?: string | null;
  fontStyle?: string;
  textColor?: string;
  fontSize?: number;
  textAlignment?: 'left' | 'center' | 'right';
  backgroundBlur?: boolean;
  textAnimation?: 'none' | 'typewriter' | 'fade-in';
}

export const SampleVideo: React.FC<SampleVideoProps> = ({
  speechText,
  backgroundVideo,
  audioSrc,
  audioDuration,
  bgMusic,
  fontStyle = 'impact',
  textColor = 'gold',
  fontSize = 80,
  textAlignment = 'center',
  backgroundBlur = false,
  textAnimation = 'fade-in',
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  
  // Font options with system fonts for reliable server-side rendering
  const fontOptions = [
    { value: 'impact', font: 'Impact, "Arial Black", Helvetica, sans-serif', weight: '900' },
    { value: 'arial-black', font: '"Arial Black", Arial, Helvetica, sans-serif', weight: '900' },
    { value: 'anton', font: '"Helvetica Neue", "Arial Black", Impact, sans-serif', weight: '900' },
    { value: 'oswald', font: '"Trebuchet MS", "Arial Black", Impact, sans-serif', weight: '700' },
    { value: 'bangers', font: '"Courier New", "Arial Black", Impact, monospace', weight: '700' },
    { value: 'fredoka', font: '"Georgia", "Times New Roman", serif', weight: '700' },
    { value: 'montserrat', font: '"Verdana", "Helvetica", Arial, sans-serif', weight: '700' },
  ];

  // Color options (matching dashboard)
  const colorOptions = [
    { value: 'gold', color: '#FFD700', shadowColor: 'rgba(255, 215, 0, 0.6)' },
    { value: 'white', color: '#FFFFFF', shadowColor: 'rgba(255, 255, 255, 0.6)' },
    { value: 'red', color: '#FF4444', shadowColor: 'rgba(255, 68, 68, 0.6)' },
    { value: 'blue', color: '#4A90E2', shadowColor: 'rgba(74, 144, 226, 0.6)' },
    { value: 'green', color: '#4CAF50', shadowColor: 'rgba(76, 175, 80, 0.6)' },
    { value: 'purple', color: '#9C27B0', shadowColor: 'rgba(156, 39, 176, 0.6)' },
    { value: 'orange', color: '#FF9800', shadowColor: 'rgba(255, 152, 0, 0.6)' },
    { value: 'cyan', color: '#00BCD4', shadowColor: 'rgba(0, 188, 212, 0.6)' },
    { value: 'pink', color: '#E91E63', shadowColor: 'rgba(233, 30, 99, 0.6)' },
    { value: 'yellow', color: '#FFEB3B', shadowColor: 'rgba(255, 235, 59, 0.6)' },
  ];
  
  const selectedFontStyle = fontOptions.find(f => f.value === fontStyle) || fontOptions[0];
  const selectedColorStyle = colorOptions.find(c => c.value === textColor) || colorOptions[0];
  
  // Debug logging for font/color selection (frame 0 only)
  if (frame === 0) {
    console.log('🎨 SampleVideo Font/Color Debug:', {
      receivedFontStyle: fontStyle,
      receivedTextColor: textColor,
      selectedFont: selectedFontStyle,
      selectedColor: selectedColorStyle,
      availableFonts: fontOptions.map(f => f.value),
      availableColors: colorOptions.map(c => c.value),
      fontSize,
      textAlignment,
      backgroundBlur,
      textAnimation
    });
  }

  // Helper function to get animation styles for single word display
  const getWordAnimationStyle = () => {
    const baseStyle = {
      color: selectedColorStyle.color,
      display: 'inline-block' as const,
      textShadow: `0 0 15px ${selectedColorStyle.shadowColor}, 3px 3px 6px rgba(0,0,0,0.8)`,
    };

    if (textAnimation === 'none') {
      return {
        ...baseStyle,
        transform: 'scale(1.1)',
        opacity: 1,
      };
    }

    if (textAnimation === 'fade-in') {
      // Fade in animation for single word
      const fadeProgress = interpolate(frame % 30, [0, 15, 30], [0.3, 1, 0.8], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      
      return {
        ...baseStyle,
        opacity: fadeProgress,
        transform: `scale(${1 + fadeProgress * 0.2})`,
        filter: 'brightness(1.2)',
      };
    }

    if (textAnimation === 'typewriter') {
      return {
        ...baseStyle,
        transform: 'scale(1.1)',
        opacity: 1,
        filter: 'brightness(1.2)',
      };
    }

    return baseStyle;
  };
  
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

      {/* Background Music */}
      {bgMusic && (
        <Audio 
          src={bgMusic} 
          volume={0.3} // Lower volume so it doesn't overpower the speech
          loop
        />
      )}

      {/* Background Video - ULTRA SMOOTH PLAYBACK OPTIMIZED */}
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
            transform: 'scale(1.02)', // Minimal zoom to avoid performance issues
            filter: 'brightness(0.85)', // Slightly darken for text readability
            willChange: 'auto',
          }}
          muted
          playbackRate={1.0} // Exactly 1.0 for perfect sync
          loop
          // Remotion-specific optimizations for smooth playback
          startFrom={0}
          endAt={durationInFrames}
          // Enable hardware acceleration and smooth rendering
          playsInline
        />
      )}
      
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px) scale(${scale})`,
          textAlign: textAlignment, // Use the dynamic text alignment
          color: 'white',
          padding: '60px 40px',
          maxWidth: '95%',
          zIndex: 10,
          position: 'relative',
        }}
      >
        {/* Word-by-word text display with styling and animations */}
        <div
          style={{
            fontSize,
            margin: 0,
            lineHeight: 1.4,
            textShadow: backgroundBlur 
              ? '0 0 50px rgba(0,0,0,0.9), 6px 6px 20px rgba(0,0,0,0.9), -3px -3px 15px rgba(0,0,0,0.8)'
              : '0 0 30px rgba(0,0,0,0.8), 4px 4px 12px rgba(0,0,0,0.9), -2px -2px 8px rgba(0,0,0,0.6)',
            wordWrap: 'break-word',
            hyphens: 'auto',
            fontFamily: selectedFontStyle.font,
            fontWeight: selectedFontStyle.weight,
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased',
            position: 'relative',
            ...(backgroundBlur && {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '15px',
              padding: '20px 30px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            })
          }}
        >
          {(() => {
            if (!speechText) return '';
            
            const currentTime = frame / fps;
            const words = speechText.split(' ').filter(word => word.trim());
            
            // Calculate current word index based on precise timing (duration / word count)
            const totalDuration = audioDuration || (durationInFrames / fps);
            const adjustedDuration = Math.max(totalDuration * 0.95, 3);
            const timePerWord = adjustedDuration / words.length;
            const currentWordIndex = Math.floor(currentTime / timePerWord);
            
                        // Show only current word (1 word per frame max)
            if (currentWordIndex >= 0 && currentWordIndex < words.length) {
              const currentWord = words[currentWordIndex];
              let displayWord = currentWord;
              let showCursor = false;
              
              // Handle typewriter animation
              if (textAnimation === 'typewriter') {
                const progress = Math.min(1, Math.max(0, (frame % 60) / 30)); // 0.5 second per word
                const visibleChars = Math.floor(progress * currentWord.length);
                displayWord = currentWord.slice(0, Math.max(1, visibleChars));
                showCursor = displayWord.length < currentWord.length;
              }
              
              return (
                <span style={getWordAnimationStyle()}>
                  {displayWord}
                  {showCursor && <span style={{ opacity: 0.7 }}>|</span>}
                </span>
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