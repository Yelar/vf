import {Composition} from 'remotion';
import {SampleVideo} from './SampleVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SampleVideo"
        component={SampleVideo as any}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          titleText: "Welcome to AI Motion",
          subtitleText: "Create amazing videos with Remotion",
        }}
      />
    </>
  );
}; 