import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  userId?: string | null;
  type: 'system' | 'support' | 'broadcast';
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  meta?: Record<string, any>;
}

const MessageSchema = new Schema<IMessage>({
  userId: { type: String, default: null },
  type: { type: String, enum: ['system', 'support', 'broadcast'], required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  meta: { type: Schema.Types.Mixed }
});

export default mongoose.model<IMessage>('Message', MessageSchema);
