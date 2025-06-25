import {Composition, registerRoot} from 'remotion';
import {SampleVideo} from './SampleVideo';
import {QuizVideo} from './QuizVideo';
import {InstagramPost} from './InstagramPost';

// Placeholder DialogueVideo component
const DialogueVideo: React.FC<{
  transcript: Array<{word: string; start: number}>;
  voiceChunks: Array<unknown>;
  images: Array<unknown>;
  bgVideo: string;
  bgMusic: string;
}> = (props) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '48px',
      fontWeight: 'bold'
    }}>
      {props.transcript.map((item, index) => (
        <span key={index} style={{margin: '0 10px'}}>{item.word}</span>
      ))}
    </div>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SampleVideo"
        component={SampleVideo as unknown as React.ComponentType<Record<string, unknown>>}
        durationInFrames={300}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{
          speechText: "Welcome to AI Motion",
          backgroundVideo: null,
          audioSrc: null,
          audioDuration: null,
          bgMusic: null,
        }}
      />
      <Composition
        id="DialogueVideo"
        component={DialogueVideo}
        durationInFrames={900} // 30 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          transcript: [
            { word: 'Hello', start: 0 },
            { word: 'World', start: 15 }
          ],
          voiceChunks: [],
          images: [],
          bgVideo: '/assets/bg.mp4',
          bgMusic: '/assets/music.mp3'
        }}
      />
      <Composition
        id="QuizVideo"
        component={QuizVideo as unknown as React.ComponentType<Record<string, unknown>>}
        durationInFrames={1800} // 30 seconds at 60fps
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{
          segments: [
            {
              id: 'intro',
              type: 'text' as const,
              text: 'Welcome to our quiz!',
              duration: 3,
            },
            {
              id: 'q1',
              type: 'question' as const,
              text: 'What is the capital of France?',
              duration: 3,
            },
            {
              id: 'choices1',
              type: 'choices' as const,
              text: 'A: Paris. B: London. C: Madrid. D: Berlin',
              duration: 4,
            },
            {
              id: 'wait1',
              type: 'wait' as const,
              text: '5, 4, 3, 2, 1',
              duration: 5,
            },
            {
              id: 'answer1',
              type: 'answer' as const,
              text: 'The correct answer is A: Paris',
              duration: 3,
            },
          ],
          font: 'montserrat',
          fontSize: 85,
          textColor: 'white',
          textAlignment: 'center',
          backgroundBlur: false,
          backgroundVideo: null,
        }}
      />
      <Composition
        id="InstagramPost"
        component={InstagramPost as unknown as React.ComponentType<Record<string, unknown>>}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          variant: {
            id: 'sample',
            type: 'text',
            title: 'Sample Title',
            content: 'Sample content for Instagram post',
            style: {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textColor: '#ffffff',
              accentColor: '#ff6b6b',
              font: 'Inter, sans-serif',
              theme: 'gradient'
            },
            metadata: {
              hashtags: ['sample'],
              caption: 'Sample caption',
              engagement_tips: ['Sample tip']
            }
          },
          currentSlide: 0
        }}
      />
    </>
  );
}; 

// Register the root component
registerRoot(RemotionRoot); 