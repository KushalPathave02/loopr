import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { Request, Response } from 'express';

const router = express.Router();

// Middleware to check valid userId
function validateUserId(req: Request, res: Response, next: Function) {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  next();
}

// GET /api/wallet/:userId/balance
router.get('/:userId/balance', validateUserId, async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ walletBalance: user.walletBalance || 0 });
});

// POST /api/wallet/:userId/add
router.post('/:userId/add', validateUserId, async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.walletBalance = (user.walletBalance || 0) + amount;
  await user.save();
  // Log transaction
  await Transaction.create({
    date: new Date(),
    amount,
    category: 'Wallet Add',
    status: 'completed',
    user: user._id,
    type: 'wallet',
  });
  res.json({ walletBalance: user.walletBalance });
});

// POST /api/wallet/:userId/withdraw
router.post('/:userId/withdraw', validateUserId, async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if ((user.walletBalance || 0) < amount) {
    return res.status(400).json({ error: 'Insufficient wallet balance' });
  }
  user.walletBalance = (user.walletBalance || 0) - amount;
  await user.save();
  // Log transaction
  await Transaction.create({
    date: new Date(),
    amount: -amount,
    category: 'Wallet Withdraw',
    status: 'completed',
    user: user._id,
    type: 'wallet',
  });
  res.json({ walletBalance: user.walletBalance });
});

// GET /api/wallet/:userId/history
router.get('/:userId/history', validateUserId, async (req, res) => {
  const { userId } = req.params;
  const transactions = await Transaction.find({ user: userId, type: 'wallet' }).sort({ date: -1 });
  res.json({ transactions });
});

export default router;
