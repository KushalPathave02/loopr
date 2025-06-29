import express from 'express';
import { verifyToken } from '../middleware/auth';
import { getSummary, getChartData } from '../controllers/dashboardController';

const router = express.Router();

router.get('/summary', verifyToken, getSummary);
router.get('/chart-data', verifyToken, getChartData);

export default router;
