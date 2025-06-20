import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(16); // Excellent quality (lower CRF = better quality)
Config.setNumberOfGifLoops(1);
// High quality encoding settings
Config.setEnforceAudioTrack(false); 