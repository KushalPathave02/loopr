import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role?: string;
  walletBalance?: number;
  profilePic?: string; // Add this line
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['analyst', 'admin'], default: 'analyst' },
  walletBalance: { type: Number, default: 0 },
  profilePic: { type: String }, // Add this line
});

export default mongoose.model<IUser>('User', UserSchema);
