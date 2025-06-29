import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  user: mongoose.Types.ObjectId;
  theme: 'light' | 'dark';
  currency: string;
  emailAlerts: boolean;
  language: string;
}

const SettingsSchema = new Schema<ISettings>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  currency: { type: String, default: 'USD' },
  emailAlerts: { type: Boolean, default: false },
  language: { type: String, default: 'en' }
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);
