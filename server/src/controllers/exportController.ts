import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import { Parser } from 'json2csv';

// POST /api/export/csv
export const exportCsv = async (req: Request, res: Response) => {
  try {
    const { columns, filters } = req.body;
    if (!Array.isArray(columns) || columns.length === 0) {
      return res.status(400).json({ message: 'No columns selected' });
    }
    const query: any = {};
    // Apply filters (same as GET /transactions)
    if (filters) {
      if (filters.category) query.category = filters.category;
      if (filters.status) query.status = filters.status;
      if (filters.user) query.user = filters.user;
      if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) query.date.$gte = new Date(filters.startDate);
        if (filters.endDate) query.date.$lte = new Date(filters.endDate);
      }
      if (filters.minAmount || filters.maxAmount) {
        query.amount = {};
        if (filters.minAmount) query.amount.$gte = Number(filters.minAmount);
        if (filters.maxAmount) query.amount.$lte = Number(filters.maxAmount);
      }
    }
    const transactions = await Transaction.find(query).lean();
    // Only include selected columns
    const data = transactions.map(t => {
      const row: any = {};
      columns.forEach((col: string) => {
        row[col] = (t as any)[col];
      });
      return row;
    });
    const parser = new Parser({ fields: columns });
    const csv = parser.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment('transactions.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Failed to export CSV' });
  }
};
