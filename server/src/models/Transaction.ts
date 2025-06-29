import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  date: Date;
  amount: number;
  category: string;
  status: string;
  user: mongoose.Types.ObjectId;
  type?: 'wallet' | 'bank' | 'other';
  id?: number;
  user_id?: string;
  user_profile?: string;
}

const TransactionSchema = new Schema<ITransaction>({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  status: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['wallet', 'bank', 'other'], default: 'other' },
  id: { type: Number },
  user_id: { type: String },
  user_profile: { type: String }
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
