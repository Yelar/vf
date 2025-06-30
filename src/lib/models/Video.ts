import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  _id: string;
  user_id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  s3_url?: string;
  s3_key?: string;
  file_size: number;
  duration?: number;
  thumbnail_url?: string;
  metadata: object; // JSON object containing video generation parameters
  is_shared: boolean;
  created_at: Date;
  updated_at: Date;
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
  s3_url: {
    type: String,
    required: false,
    default: null,
  },
  s3_key: {
    type: String,
    required: false,
    default: null,
  },
  file_size: {
    type: Number,
    required: false, // Optional for placeholder creation
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
    required: false, // Optional for placeholder creation
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
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for better performance
VideoSchema.index({ user_id: 1 });
VideoSchema.index({ is_shared: 1 });
VideoSchema.index({ created_at: -1 });
VideoSchema.index({ updated_at: -1 });

// Add middleware to update the updated_at timestamp on save
VideoSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Force clear the model cache to ensure schema updates take effect
if (mongoose.models && mongoose.models.Video) {
  delete mongoose.models.Video;
}

export default mongoose.models?.Video || mongoose.model<IVideo>('Video', VideoSchema); 