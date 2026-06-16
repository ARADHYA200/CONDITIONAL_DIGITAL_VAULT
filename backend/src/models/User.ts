import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password_hash: string;
  created_at: Date;
  last_login_at?: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  last_login_at: { type: Date, default: null }
});

export const User = mongoose.model<IUser>('User', UserSchema);
