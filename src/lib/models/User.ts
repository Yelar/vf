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
});

// Create indexes for better performance
// Note: email index is automatically created by unique: true
UserSchema.index({ verification_token: 1 });
UserSchema.index({ password_reset_token: 1 });

// Force clear the model cache to ensure schema updates take effect
if (mongoose.models && mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.models?.User || mongoose.model<IUser>('User', UserSchema); 