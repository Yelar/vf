import {Composition, registerRoot} from 'remotion';
import {SampleVideo} from './SampleVideo';

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
    </>
  );
}; 

// Register the root component
registerRoot(RemotionRoot); 