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
- 🏗️ **Video Library**: Save and manage your created videos
- 📊 **User Authentication**: Secure login and personal video collections
- 💾 **Cloud Storage**: Videos stored securely with AWS S3 integration
- 🔍 **Search & Filter**: Find your videos quickly by title or description
- 🎤 **Voice Input**: Speak your topic ideas with Azure Speech Service transcription
- 📧 **Async Processing**: Videos processed in background with email notifications
- ⚡ **Non-blocking**: Continue working while videos render (2-5 minutes)

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

3. **Set up API Keys**
   - Get an API key from [Eleven Labs](https://elevenlabs.io/docs/api-reference/authentication)
   - Set up AWS S3 bucket and IAM credentials (see S3_MIGRATION_SETUP.md for details)
   - Get a Resend API key from [Resend](https://resend.com) for email notifications
   - Create a `.env.local` file in the root directory:
   ```env
   ELEVEN_LABS_API_KEY=your_eleven_labs_api_key_here
   UPLOADTHING_TOKEN=your_uploadthing_v7_token_here
   RESEND_API_KEY=your_resend_api_key_here
   NEXTAUTH_SECRET=your_secret_key_here
   # Azure OpenAI Configuration
   AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
   AZURE_OPENAI_API_VERSION=2024-04-01-preview
   ```

   **⚠️ Important**: Ensure your AWS S3 bucket has proper CORS configuration and public read access for video playback.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000) or [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

## 🎬 How to Use

### Navigation
- **Dashboard** (`/dashboard`): Hub with statistics and quick navigation
- **Create Video** (`/video/new`): AI-powered video creation studio
- **Library** (`/library`): Manage your personal video collection
- **Shared Videos** (`/shared`): Browse community-shared content

### Creating Videos
1. **Navigate to Creation**: From dashboard, click "Create New Video" or go to `/video/new`
2. **Choose Template**: Select from AI-powered content templates (Educational, Drama, Comedy, etc.)
3. **Enter Topic**: Type or use voice input (🎤) to speak your topic idea - AI will transcribe it automatically
4. **Generate Content**: Let AI create engaging content based on your template and topic
5. **Customize Text**: Edit the generated text or write your own
6. **Choose Voice**: Select from 6 different AI voices (male and female options)
7. **Generate Speech**: Click "Generate Speech" to create the audio with smart segmentation
8. **Style Your Video**: Customize fonts, colors, animations, and effects
9. **Add Visuals** (optional): 
   - Upload background videos or choose presets
   - Enable AI-powered image overlay from Unsplash
   - Add background music
10. **Generate Video**: 
    - Click "Generate & Save to Library" to start async video processing
    - Videos are processed in the background (2-5 minutes)
    - You'll receive an email notification with a link to your library when ready
    - No need to wait - you can close the browser and continue with other tasks

### Sharing Videos
1. **Direct Video URLs**: Each video has a direct S3 URL for sharing
2. **Copy Video Link**: Use the copy button in video creation page or dashboard to copy the direct video URL
3. **Universal Sharing**: Share the video URL anywhere - social media, messaging apps, email, etc.
4. **Instant Access**: Recipients can immediately view/download the video without needing app access

### Managing Your Library
1. **View Library**: Click "Library" in the header to see all your saved videos
2. **Search Videos**: Use the search bar to find specific videos
3. **Edit Titles**: Click the edit icon to rename your videos
4. **Download**: Click download button to save videos locally
5. **Share**: Use copy buttons to get direct video URLs for sharing
6. **Delete**: Remove unwanted videos from your library

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

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, SQLite Database
- **Video**: Remotion for rendering, MediaRecorder for generation
- **AI Services**: Azure OpenAI (GPT-4), Eleven Labs (Text-to-Speech)
- **File Storage**: AWS S3
- **Email**: Resend
- **Authentication**: NextAuth.js v5
- **UI Components**: Radix UI, Lucide React Icons

## 🔧 Troubleshooting

### S3 Issues

**Problem**: "Request timed out" or "Connection timeout" errors
**Solutions**:
1. Ensure your AWS credentials are valid and have proper S3 permissions
2. Check your internet connection and try again
3. For large files, the system will automatically retry with exponential backoff
4. Verify your S3 bucket region matches AWS_REGION environment variable

**Problem**: "AWS S3 configuration missing" error
**Solution**: Make sure your `.env.local` file contains the S3 credentials:
```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=your_region_here
AWS_S3_BUCKET_NAME=your_bucket_name_here
```

### Video Generation Issues

**Problem**: Videos are processing but not appearing in library
**Solutions**:
1. Check the server logs for upload errors
2. Ensure sufficient storage space
3. Verify email notifications are working (check spam folder)
4. Videos process asynchronously - wait 2-5 minutes for completion

**Problem**: Audio not included in downloaded videos
**Solution**: This is typically a browser permission issue. Try:
1. Refresh the page and regenerate the video
2. Ensure microphone permissions are granted
3. Use the "Generate & Save to Library" option instead of direct download

### Environment Variables

**Required Variables**:
```env
# Core functionality (AWS S3)
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=your_region_here
AWS_S3_BUCKET_NAME=your_bucket_name_here
ELEVEN_LABS_API_KEY=your_api_key_here
NEXTAUTH_SECRET=your_secret_here

# AI Features (Azure OpenAI)
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=your_endpoint_here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o

# Email notifications
RESEND_API_KEY=your_resend_key_here
```

**Testing Configuration**:
Run the development server and check the console for any missing environment variable warnings.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/                # Authentication endpoints
│   │   ├── generate-speech/     # Eleven Labs API integration
│   │   ├── render-video/        # Video generation API
│   │   ├── render-and-save/     # Video generation + library save
│   │   ├── videos/              # Video CRUD operations
│   │   └── upload-s3/           # S3 file upload handling
│   ├── auth/                    # Sign in/up pages
│   ├── dashboard/               # Main video creation studio
│   ├── library/                 # Video library management
│   └── layout.tsx
├── components/
│   ├── auth/                    # Authentication components
│   ├── providers/               # Context providers
│   └── ui/                      # shadcn/ui components
├── remotion/
│   ├── Root.tsx
│   └── SampleVideo.tsx          # Video composition with word-by-word text
└── lib/
    ├── auth.ts                  # NextAuth configuration
    ├── auth-db.ts               # Database operations
    ├── s3.ts                    # AWS S3 configuration
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

### Async Video Processing
- **Background Processing**: Videos render in the background, no need to wait
- **Email Notifications**: Receive beautiful HTML emails when videos are ready
- **Processing Time**: Typical processing time is 2-5 minutes depending on video length
- **Non-blocking**: Continue creating more content while previous videos process
- **Library Integration**: Videos automatically appear in your library when complete
- **Direct Links**: Email includes direct links to view and download your videos

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
# Required: AI Services
ELEVEN_LABS_API_KEY=your_eleven_labs_api_key_here
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-04-01-preview

# Required: Authentication
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# Required: File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=your_region_here
AWS_S3_BUCKET_NAME=your_bucket_name_here

# Required: Email Notifications
RESEND_API_KEY=your_resend_api_key_here

# Optional: For production
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🗂️ Project Structure (Updated)

```
src/
├── app/
│   ├── api/                     # API endpoints
│   │   ├── auth/               # Authentication
│   │   ├── dashboard-stats/    # Dashboard statistics
│   │   ├── generate-speech/    # AI voice generation
│   │   ├── videos/            # Video CRUD operations
│   │   │   ├── [id]/          # Individual video management
│   │   │   └── shared/[id]/   # Public video sharing
│   │   └── ...
│   ├── dashboard/              # Main navigation hub
│   ├── video/[id]/            # Video creation & editing
│   ├── library/               # Personal video library
│   ├── shared/               # Community videos
│   ├── watch/[id]/           # Public video preview
│   └── auth/                 # Authentication pages
├── components/
│   ├── auth/                 # Auth components
│   └── ui/                   # UI components
├── remotion/                 # Video composition
└── lib/                      # Utilities & config
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

test