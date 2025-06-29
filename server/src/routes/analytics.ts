import { Router } from 'express';

const router = Router();

// Dummy analytics data for dashboard
router.get('/', (req, res) => {
  res.json({
    monthlyTrend: [
      { month: 'Jan', revenue: 5000, expense: 3200 },
      { month: 'Feb', revenue: 6000, expense: 3500 },
      { month: 'Mar', revenue: 7000, expense: 4000 },
      { month: 'Apr', revenue: 6500, expense: 3700 },
      { month: 'May', revenue: 7200, expense: 4200 },
      { month: 'Jun', revenue: 8000, expense: 5000 },
    ],
    categoryBreakdown: [
      { category: 'Food', amount: 1200 },
      { category: 'Rent', amount: 2000 },
      { category: 'Travel', amount: 800 },
      { category: 'Shopping', amount: 600 },
      { category: 'Other', amount: 400 },
    ],
    topExpenses: [
      { category: 'Rent', amount: 2000 },
      { category: 'Food', amount: 1200 },
      { category: 'Travel', amount: 800 },
      { category: 'Shopping', amount: 600 },
      { category: 'Other', amount: 400 },
    ],
    spendChange: { percent: 15, more: true }
  });
});

export default router;
