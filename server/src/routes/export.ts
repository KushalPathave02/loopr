import express from 'express';
import { verifyToken } from '../middleware/auth';
import { exportCsv } from '../controllers/exportController';

const router = express.Router();

router.post('/csv', verifyToken, exportCsv);

export default router;
