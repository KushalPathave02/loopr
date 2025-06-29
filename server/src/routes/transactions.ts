import express from 'express';
import { verifyToken } from '../middleware/auth';
import { getTransactions, uploadTransactions } from '../controllers/transactionsController';

const router = express.Router();

router.get('/', verifyToken, getTransactions);
router.post('/upload', verifyToken, uploadTransactions);

// (Optional) POST /transactions (add single), GET/PUT/DELETE /transactions/:id

export default router;
