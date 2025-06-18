# YouTube Shorts Generator with AI Speech

A Next.js application that generates vertical videos perfect for YouTube Shorts, Instagram Reels, and TikTok with AI-powered text-to-speech and word-by-word text display.

## ✨ Features

- 🎤 **AI Text-to-Speech**: Professional voices powered by Eleven Labs
- 📱 **Word-by-Word Display**: Text appears progressively as it's spoken
- 🎬 **Vertical Video Format**: Perfect 9:16 aspect ratio for mobile platforms
- 🎯 **Dynamic Duration**: Video length automatically adjusts to speech duration
- 🎥 **Custom Backgrounds**: Upload your own videos or use presets
- ⚡ **Real-time Preview**: See your video before generating
- 📦 **High Quality Output**: 1080x1920 resolution at 60fps

## 🚀 Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd vf
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Eleven Labs API**
   - Get an API key from [Eleven Labs](https://elevenlabs.io/docs/api-reference/authentication)
   - Create a `.env.local` file in the root directory:
   ```env
   ELEVEN_LABS_API_KEY=your_eleven_labs_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

## 🎬 How to Use

1. **Enter Speech Text**: Write the text you want to be spoken and displayed
2. **Choose Voice**: Select from 6 different AI voices (male and female options)
3. **Generate Speech**: Click "Generate Speech" to create the audio
4. **Add Background** (optional): Upload a video or choose a preset
5. **Generate Video**: Click "Generate YouTube Shorts Video" to create your final video

## 🎯 Video Output

- **Resolution**: 1080×1920 (9:16 vertical)
- **Frame Rate**: 60 FPS for ultra-smooth playback
- **Duration**: Automatically matches speech length (minimum 5 seconds)
- **Format**: MP4 or WebM depending on browser support
- **Audio**: High-quality AI speech synchronized with text
- **Text Display**: Word-by-word animation with current word highlighting

## 🎨 Available Voices

- 👩 **Bella** - Friendly Female
- 👨 **Adam** - Professional Male
- 👨 **Antoni** - Warm Male
- 👨 **Arnold** - Deep Male
- 👩 **Elli** - Young Female
- 👨 **Josh** - Casual Male

## 🛠 Tech Stack

- **Framework**: Next.js 15 with React 19
- **Video**: Remotion for video composition
- **UI**: Tailwind CSS with shadcn/ui components
- **Speech**: Eleven Labs API
- **Audio**: Web Audio API for mixing
- **Recording**: MediaRecorder API with canvas streams

## 📁 Project Structure

```
src/
├── app/
│   ├── api/generate-speech/     # Eleven Labs API integration
│   ├── dashboard/               # Main application page
│   └── layout.tsx
├── components/
│   └── ui/                      # shadcn/ui components
├── remotion/
│   ├── Root.tsx
│   └── SampleVideo.tsx          # Video composition with word-by-word text
└── lib/
    └── utils.ts
```

## 🎥 Features in Detail

### Word-by-Word Text Display
- Text appears progressively as the AI voice speaks
- Current word is highlighted in gold
- Automatic text wrapping for long sentences
- Smooth animations and transitions

### AI Speech Integration
- Real-time speech generation using Eleven Labs
- High-quality AI voices with natural intonation
- Audio duration detection for video timing
- Preview audio before video generation

### Dynamic Video Duration
- Video length automatically adjusts to match speech
- Minimum 5-second duration for short text
- Perfect synchronization between audio and text
- Optimal pacing for viewer engagement

## 🔧 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Preview Remotion compositions
npm run remotion:preview
```

## 📝 Environment Variables

Create a `.env.local` file with:

```env
# Required: Eleven Labs API Key
ELEVEN_LABS_API_KEY=your_api_key_here
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Perfect for creating engaging content for:**
- 📱 YouTube Shorts
- 📸 Instagram Reels
- 🎵 TikTok Videos
- 💼 Social Media Marketing
- 🎓 Educational Content
- 📢 Announcements
