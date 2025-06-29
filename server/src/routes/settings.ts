import { Router } from 'express';
import Settings from '../models/Settings';
import User from '../models/User';
import mongoose from 'mongoose';

const router = Router();

// GET user settings
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid user ID' });
    const settings = await Settings.findOne({ user: userId });
    if (!settings) return res.status(404).json({ error: 'Settings not found' });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update user settings
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid user ID' });
    const update = req.body;
    const settings = await Settings.findOneAndUpdate(
      { user: userId },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE user settings (optional, for account deletion)
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid user ID' });
    await Settings.deleteOne({ user: userId });
    res.json({ message: 'Settings deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
