import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  _id: string;
  user_id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  uploadthing_url?: string;
  uploadthing_key?: string;
  file_size: number;
  duration?: number;
  thumbnail_url?: string;
  metadata: object; // JSON object containing video generation parameters
  is_shared: boolean;
  created_at: Date;
}

const VideoSchema = new Schema<IVideo>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: null,
  },
  uploadthing_url: {
    type: String,
    required: false,
    default: null,
  },
  uploadthing_key: {
    type: String,
    required: false,
    default: null,
  },
  file_size: {
    type: Number,
    required: false, // Also make this optional for placeholder creation
    default: 0,
  },
  duration: {
    type: Number,
    default: null,
  },
  thumbnail_url: {
    type: String,
    default: null,
  },
  metadata: {
    type: Schema.Types.Mixed,
    required: false, // Make metadata optional for placeholder creation
    default: {},
  },
  is_shared: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for better performance
VideoSchema.index({ user_id: 1 });
VideoSchema.index({ is_shared: 1 });
VideoSchema.index({ created_at: -1 });

// Force clear the model cache to ensure schema updates take effect
if (mongoose.models && mongoose.models.Video) {
  delete mongoose.models.Video;
}

export default mongoose.models?.Video || mongoose.model<IVideo>('Video', VideoSchema); 