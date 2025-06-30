import mongoose, { Document, Schema } from 'mongoose';

export interface IBackgroundMusic extends Document {
  _id: string;
  name: string;
  description?: string;
  s3_url: string;
  s3_key: string;
  file_size: number;
  duration?: number;
  category?: string;
  tags?: string[];
  is_active: boolean;
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const BackgroundMusicSchema = new Schema<IBackgroundMusic>({
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
  s3_url: {
    type: String,
    required: true,
  },
  s3_key: {
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
    enum: ['general', 'ambient', 'electronic', 'classical', 'jazz', 'rock', 'pop', 'hip-hop', 'folk', 'other'],
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
BackgroundMusicSchema.index({ created_by: 1 });
BackgroundMusicSchema.index({ category: 1 });
BackgroundMusicSchema.index({ is_active: 1 });
BackgroundMusicSchema.index({ tags: 1 });

// Update the updated_at field before saving
BackgroundMusicSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Force clear the model cache to ensure schema updates take effect
if (mongoose.models && mongoose.models.BackgroundMusic) {
  delete mongoose.models.BackgroundMusic;
}

export default mongoose.models?.BackgroundMusic || mongoose.model<IBackgroundMusic>('BackgroundMusic', BackgroundMusicSchema); 