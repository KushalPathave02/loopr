import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import mongoose from 'mongoose';

// GET /api/dashboard/summary
export const getSummary = async (req: Request, res: Response) => {
  try {
    // Aggregate total revenue, expense, net profit
    const result = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [{ $gt: ['$amount', 0] }, '$amount', 0]
            }
          },
          totalExpense: {
            $sum: {
              $cond: [{ $lt: ['$amount', 0] }, '$amount', 0]
            }
          }
        }
      }
    ]);
    const { totalRevenue = 0, totalExpense = 0 } = result[0] || {};
    const netProfit = totalRevenue + totalExpense; // expenses are negative
    res.json({ totalRevenue, totalExpense: Math.abs(totalExpense), netProfit });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch summary' });
  }
};

// GET /api/dashboard/chart-data
export const getChartData = async (req: Request, res: Response) => {
  try {
    // Monthly Revenue vs Expense
    const monthly = await Transaction.aggregate([
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' } },
          revenue: {
            $sum: {
              $cond: [{ $gt: ['$amount', 0] }, '$amount', 0]
            }
          },
          expense: {
            $sum: {
              $cond: [{ $lt: ['$amount', 0] }, '$amount', 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Category-wise breakdown
    const categories = await Transaction.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      lineChart: monthly.map(m => ({
        month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
        revenue: m.revenue,
        expense: Math.abs(m.expense)
      })),
      pieChart: categories.map(c => ({
        category: c._id,
        value: Math.abs(c.total)
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch chart data' });
  }
};
