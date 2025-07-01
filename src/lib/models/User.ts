import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  email_verified: boolean;
  verification_token?: string;
  verification_token_expires?: Date;
  password_reset_token?: string;
  password_reset_token_expires?: Date;
  created_at: Date;
  monthly_generation_limit: number;
  remaining_generation_limit: number;
  generation_limit_reset_date: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email_verified: {
    type: Boolean,
    default: false,
  },
  verification_token: {
    type: String,
    default: null,
  },
  verification_token_expires: {
    type: Date,
    default: null,
  },
  password_reset_token: {
    type: String,
    default: null,
  },
  password_reset_token_expires: {
    type: Date,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  monthly_generation_limit: {
    type: Number,
    default: 70, // Default limit of 70 generations per month (shared across these AI features:
    // - /api/posts/generate
    // - /api/generate-speech/azure-tts
    // - /api/generate-educational-content
    // - /api/generate-quiz
    // - /api/render-and-save
    // - /api/render-quiz-video)
  },
  remaining_generation_limit: {
    type: Number,
    default: 70, // Initially set to monthly limit
  },
  generation_limit_reset_date: {
    type: Date,
    default: () => {
      const now = new Date();
      // Set to the first day of next month at 00:00:00
      return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    },
  },
});

// Create indexes for better performance
// Note: email index is automatically created by unique: true
UserSchema.index({ verification_token: 1 });
UserSchema.index({ password_reset_token: 1 });

// Add method to check if user can generate content
UserSchema.methods.canGenerateContent = function(): boolean {
  const now = new Date();
  
  // If we've passed the reset date, reset the limit
  if (now >= this.generation_limit_reset_date) {
    this.remaining_generation_limit = this.monthly_generation_limit;
    // Set next reset date to first day of next month
    this.generation_limit_reset_date = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    this.save();
  }
  
  return this.remaining_generation_limit > 0;
};

// Add method to decrement generation limit
UserSchema.methods.decrementGenerationLimit = async function(): Promise<boolean> {
  if (!this.canGenerateContent()) {
    return false;
  }
  
  this.remaining_generation_limit--;
  await this.save();
  return true;
};

// Force clear the model cache to ensure schema updates take effect
if (mongoose.models && mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.models?.User || mongoose.model<IUser>('User', UserSchema); 