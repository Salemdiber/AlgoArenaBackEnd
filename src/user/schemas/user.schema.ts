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
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: { type: String, enum: ['email', 'sms'], default: null },
    twoFactorCode: { type: String, default: null },
    twoFactorCodeExpires: { type: Date, default: null },
    phoneNumber: { type: String, default: null },
  },
  { timestamps: true },
);
