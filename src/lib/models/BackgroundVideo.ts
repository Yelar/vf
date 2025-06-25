import mongoose, { Document, Schema } from 'mongoose';

export interface IBackgroundVideo extends Document {
  _id: string;
  name: string;
  description?: string;
  uploadthing_url: string;
  uploadthing_key: string;
  file_size: number;
  duration?: number;
  category?: string;
  tags?: string[];
  is_active: boolean;
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const BackgroundVideoSchema = new Schema<IBackgroundVideo>({
  name: {
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
    required: true,
  },
  uploadthing_key: {
    type: String,
    required: true,
  },
  file_size: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    default: null,
  },
  category: {
    type: String,
    default: 'general',
    enum: ['general', 'nature', 'abstract', 'technology', 'lifestyle', 'gaming', 'sports', 'music', 'other'],
  },
  tags: [{
    type: String,
    trim: true,
  }],
  is_active: {
    type: Boolean,
    default: true,
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
BackgroundVideoSchema.index({ created_by: 1 });
BackgroundVideoSchema.index({ category: 1 });
BackgroundVideoSchema.index({ is_active: 1 });
BackgroundVideoSchema.index({ tags: 1 });

// Update the updated_at field before saving
BackgroundVideoSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Force clear the model cache to ensure schema updates take effect
if (mongoose.models && mongoose.models.BackgroundVideo) {
  delete mongoose.models.BackgroundVideo;
}

export default mongoose.models?.BackgroundVideo || mongoose.model<IBackgroundVideo>('BackgroundVideo', BackgroundVideoSchema); 