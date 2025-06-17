import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

interface SampleVideoProps {
  titleText: string;
  subtitleText: string;
}

export const SampleVideo: React.FC<SampleVideoProps> = ({
  titleText,
  subtitleText,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

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
        background: `linear-gradient(135deg, rgba(59, 130, 246, ${backgroundOpacity}), rgba(147, 51, 234, ${backgroundOpacity}))`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
      }}
    >
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
      
      {/* Animated particles */}
      {Array.from({length: 10}).map((_, i) => {
        const particleFrame = (frame + i * 5) % 60;
        const particleOpacity = interpolate(particleFrame, [0, 30, 60], [0, 1, 0]);
        const particleY = interpolate(particleFrame, [0, 60], [100, -100]);
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              backgroundColor: 'white',
              borderRadius: '50%',
              left: `${10 + i * 8}%`,
              top: '50%',
              transform: `translateY(${particleY}px)`,
              opacity: particleOpacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}; 