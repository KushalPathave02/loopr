import { Router } from 'express';
import User from '../models/User';
import mongoose from 'mongoose';

const router = Router();
import { verifyToken } from '../middleware/auth';

// GET current logged-in user profile (for dropdown)
router.get('/profile', verifyToken, async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized: No user found in token' });
  }
  try {
    const user = await User.findById(req.user.id).select('name email role profilePic');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET user profile by ID
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid user ID' });
  const user = await User.findById(userId).select('-password');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PUT update user profile
router.put('/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid user ID' });
  const update = req.body;
  const user = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true }).select('-password');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

import upload from '../middleware/upload';
import path from 'path';

// POST upload profile picture
router.post('/:userId/profile-pic', upload.single('profilePic'), async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid user ID' });
  if (!(req as any).file) return res.status(400).json({ error: 'No file uploaded' });
  const imgPath = `/uploads/${(req as any).file.filename}`;
  const user = await User.findByIdAndUpdate(userId, { profilePic: imgPath }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ profilePic: imgPath, user });
});

export default router;
