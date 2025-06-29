import express from 'express';
import Message from '../models/Message';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// Get all messages for the user (and broadcasts)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const messages = await Message.find({ $or: [ { userId }, { type: 'broadcast' } ] }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Submit a support/help request
router.post('/support', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { title, body } = req.body;
    const msg = await Message.create({ userId, type: 'support', title, body, read: false });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit support request' });
  }
});

// Mark a message as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const msg = await Message.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true });
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// (Admin only) Broadcast message
router.post('/broadcast', verifyToken, async (req, res) => {
  // TODO: Add admin check!
  try {
    const { title, body } = req.body;
    const msg = await Message.create({ type: 'broadcast', title, body, read: false });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to broadcast message' });
  }
});

export default router;
