import { Schema } from 'mongoose';

export const UserSchema = new Schema(
  {
    username: { type: String, required: true },
    passwordHash: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, enum: ['Player', 'Admin'], default: 'Player' },
    avatar: { type: String, default: null },
    bio: { type: String, default: null },
    status: { type: Boolean, default: true },
    googleId: { type: String, default: null },
    githubId: { type: String, default: null },
    resetToken: { type: String, required: false, default: null },
    resetTokenExpires: { type: Date, required: false, default: null },
  },
  { timestamps: true },
);
