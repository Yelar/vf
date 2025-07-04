import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Img,
  Audio,
  Sequence,
  Video,
} from 'remotion';

export interface QuizVideoProps {
  segments: Array<{
    id: string;
    type: 'question' | 'choices' | 'wait' | 'answer' | 'text';
    text: string;
    audio?: string;
    duration?: number;
    image?: string;
    originalIndex?: number;
  }>;
  font?: string;
  fontSize?: number;
  textColor?: string;
  textAlignment?: 'left' | 'center' | 'right';
  backgroundBlur?: boolean;
  textAnimation?: 'none' | 'typewriter' | 'fade-in';
  backgroundVideo?: string;
  voice?: string;
  bgMusic?: string | null;
  segmentImages?: Array<{
    segmentIndex: number;
    imageUrl: string;
    description?: string;
  }> | null;
}

export const QuizVideo: React.FC<QuizVideoProps> = ({
  segments,
  font = 'montserrat',
  fontSize = 85,
  textColor = 'white',
  textAlignment = 'center',
  backgroundBlur = false,
  backgroundVideo,
  bgMusic,
  segmentImages,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Calculate segment timing
  let currentTime = 0;
  const segmentTimings = segments.map((segment) => {
    const startTime = currentTime;
    const duration = segment.duration || estimateDuration(segment.text);
    const endTime = startTime + duration;
    currentTime = endTime;
    
    return {
      ...segment,
      startTime,
      endTime,
      duration,
      startFrame: Math.floor(startTime * fps),
      endFrame: Math.floor(endTime * fps),
    };
  });

  // Find current segment
  const currentSegment = segmentTimings.find(
    (segment) => frame >= segment.startFrame && frame < segment.endFrame
  );

  if (!currentSegment) return null;

  // Calculate progress within current segment
  const segmentFrame = frame - currentSegment.startFrame;
  const segmentProgress = segmentFrame / (currentSegment.endFrame - currentSegment.startFrame);

  // Word highlighting logic
  const words = currentSegment.text.split(' ');
  const currentWordIndex = Math.floor(segmentProgress * words.length);

  return (
    <AbsoluteFill
      style={{
        background: backgroundVideo 
          ? 'transparent' 
          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: getFontFamily(font),
      }}
    >
      {/* Audio Segments - IDENTICAL to SampleVideo */}
      {(() => {
        let accumulatedFrames = 0;
        return segments.map((segment, index) => {
          const segmentDuration = segment.duration || estimateDuration(segment.text);
          const segmentFrames = Math.floor(segmentDuration * fps);
          const startFrame = accumulatedFrames;
          
          accumulatedFrames += segmentFrames;
          
          return (
            <Sequence
              key={`segment-${index}`}
              from={startFrame}
              durationInFrames={segmentFrames}
            >
              {/* Only play audio if the segment has an audio source (skip wait segments) */}
              {segment.audio && <Audio src={segment.audio} />}
            </Sequence>
          );
        });
      })()}

      {/* Background Music - IDENTICAL to SampleVideo */}
      {bgMusic && (
        <Audio 
          src={bgMusic} 
          volume={0.3} // Lower volume so it doesn't overpower the speech
          loop
        />
      )}

      {/* Background Video - IDENTICAL to SampleVideo */}
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
            filter: backgroundBlur ? 'blur(8px) brightness(0.85)' : 'brightness(0.85)', // Slightly darken for text readability
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

      {/* Segment Images Overlay - IDENTICAL to SampleVideo */}
      {segmentImages && segments && segments.length > 0 && (() => {
        let accumulatedFrames = 0;
        let currentSegmentIndex = -1;
        
        // Find which segment we're currently in
        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i];
          const segmentDuration = segment.duration || estimateDuration(segment.text);
          const segmentFrames = Math.floor(segmentDuration * fps);
          
          if (frame >= accumulatedFrames && frame < accumulatedFrames + segmentFrames) {
            currentSegmentIndex = i;
            break;
          }
          
          accumulatedFrames += segmentFrames;
        }
        
        // Find the image for the current segment
        const currentImage = segmentImages.find(img => img.segmentIndex === currentSegmentIndex);
        
        if (currentImage && currentImage.imageUrl) {
          return (
            <div
              style={{
                position: 'absolute',
                top: '8%',
                left: '50%',
                width: '95%',
                height: '30%',
                borderRadius: '8px',
                overflow: 'hidden',
                opacity: 0.8,
                zIndex: 5,
                border: 'none',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                transform: 'translateX(-50%) translateZ(0)', // Center horizontally + hardware acceleration
              }}
            >
              <img
                src={currentImage.imageUrl}
                alt={currentImage.description || 'Segment image'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
              {/* Gradient overlay for better text readability */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)',
                }}
              />
            </div>
          );
        }
        
        return null;
      })()}

      {/* Countdown Display (for wait segments) - ONLY the number */}
      {currentSegment.type === 'wait' ? (
        <div
          style={{
            fontSize: `${fontSize * 3}px`,
            color: textColor,
            fontWeight: '900',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            lineHeight: 1,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        >
          {getCountdownDisplay(currentSegment.text, segmentProgress)}
        </div>
      ) : (
        /* Quiz Content - All other segments */
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            padding: '40px',
            width: '90%',
            maxWidth: '800px',
            textAlign: textAlignment,
          }}
        >
          {/* Segment Type Badge */}
          <div
            style={{
              marginBottom: '20px',
              display: 'flex',
              justifyContent: textAlignment,
            }}
          >
            <div
              style={{
                backgroundColor: getSegmentColor(currentSegment.type),
                color: 'white',
                padding: '30px 60px',
                borderRadius: '50px',
                fontSize: '48px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '4px',
              }}
            >
              {getSegmentLabel(currentSegment.type)}
            </div>
          </div>

          {/* Main Text with Word Highlighting - HIDDEN during choice segments */}
          {currentSegment.type !== 'choices' && (
            <div
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: 1.2,
                fontWeight: 'bold',
                color: textColor,
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                marginBottom: '20px',
              }}
            >
              {renderHighlightedText(words, currentWordIndex, textColor)}
            </div>
          )}

          {/* Question Choices (for choice segments) */}
          {currentSegment.type === 'choices' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
                marginTop: '30px',
                fontSize: `${fontSize * 0.7}px`,
              }}
            >
              {parseChoices(currentSegment.text).map((choice, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <span style={{ 
                    color: '#FFD700', 
                    fontWeight: 'bold',
                    fontSize: `${fontSize * 0.7}px`
                  }}>
                    {choice.letter}:
                  </span>{' '}
                  <span style={{ 
                    color: textColor,
                    fontSize: `${fontSize * 0.6}px`
                  }}>{choice.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '40px',
              right: '40px',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${segmentProgress * 100}%`,
                height: '100%',
                backgroundColor: getSegmentColor(currentSegment.type),
                borderRadius: '2px',
                transition: 'width 0.1s ease-out',
              }}
            />
          </div>
        </div>
      )}

      {/* Background Image - Hidden during countdown */}
      {currentSegment.image && currentSegment.type !== 'wait' && (
        <Img
          src={currentSegment.image}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            opacity: 0.3,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

// Helper functions
function estimateDuration(text: string): number {
  const words = text.split(' ').length;
  const wordsPerSecond = 2.5; // Average speaking rate
  return Math.max(2, words / wordsPerSecond);
}

function getFontFamily(font: string): string {
  const fontMap: Record<string, string> = {
    impact: 'Impact, sans-serif',
    arial: 'Arial, sans-serif',
    helvetica: 'Helvetica, sans-serif',
    montserrat: 'Montserrat, sans-serif',
    oswald: 'Oswald, sans-serif',
    roboto: 'Roboto, sans-serif',
    'open-sans': 'Open Sans, sans-serif',
    lato: 'Lato, sans-serif',
    poppins: 'Poppins, sans-serif',
  };
  return fontMap[font] || 'Arial, sans-serif';
} 

function getSegmentColor(type: string): string {
  const colors: Record<string, string> = {
    question: '#3B82F6', // Blue
    choices: '#10B981',  // Green
    wait: '#F59E0B',     // Yellow
    answer: '#8B5CF6',   // Purple
    text: '#6B7280',     // Gray
  };
  return colors[type] || '#6B7280';
}

function getSegmentLabel(type: string): string {
  const labels: Record<string, string> = {
    question: '❓ Question',
    choices: '📝 Choices',
    wait: '⏰ Think Time',
    answer: '✅ Answer',
    text: '📖 Info',
  };
  return labels[type] || 'Content';
}

function renderHighlightedText(words: string[], currentWordIndex: number, textColor: string) {
  return (
    <span>
      {words.map((word, index) => (
        <span
          key={index}
          style={{
            color: index === currentWordIndex ? '#FFD700' : textColor,
            backgroundColor: index === currentWordIndex ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
            padding: index === currentWordIndex ? '2px 4px' : '0',
            borderRadius: index === currentWordIndex ? '4px' : '0',
            transition: 'all 0.2s ease',
          }}
        >
          {word}
          {index < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
}

function parseChoices(text: string): Array<{ letter: string; text: string }> {
  // Parse "A: Choice A. B: Choice B. C: Choice C. D: Choice D" format
  const matches = text.match(/([A-D]):\s*([^.]+)\.?/g) || [];
  return matches.map(match => {
    const [, letter, choiceText] = match.match(/([A-D]):\s*([^.]+)\.?/) || [];
    return { letter, text: choiceText?.trim() || '' };
  });
}

function getCountdownDisplay(text: string, progress: number): string {
  // Parse the starting number (e.g., "5" instead of "5, 4, 3, 2, 1")
  const startingNumber = parseInt(text.trim());
  if (isNaN(startingNumber) || startingNumber <= 0) return '⏰';
  
  // Ensure progress is between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  
  // Calculate current countdown number based on progress
  // Progress 0 = starting number, Progress 1 = 1
  const remainingTime = Math.ceil(startingNumber * (1 - clampedProgress));
  const currentNumber = Math.max(1, remainingTime);
  
  // Show only the current number
  return currentNumber.toString();
} 