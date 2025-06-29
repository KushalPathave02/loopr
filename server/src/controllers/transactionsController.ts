import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import mongoose from 'mongoose';

// Extend Express Request type to include 'user' property
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      // add other user properties if needed
    };
  }
}

// GET /api/transactions
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'date',
      sortOrder = 'desc',
      search = '',
      category,
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount
    } = req.query;

    const query: any = {};
    // Always filter by current user
    if (req.user && req.user.id) {
      query.user = req.user.id;
    }
    // Text search
    if (search) {
      query.$or = [
        { category: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
        { amount: isNaN(Number(search)) ? undefined : Number(search) },
        // Add more fields if needed
      ].filter(Boolean);
    }

    if (category) query.category = category;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }

    // Sorting
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const skip = (Number(page) - 1) * Number(pageSize);
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(pageSize))
      .populate('user', 'name email');

    res.json({ transactions, total });
  } catch (err) {
    console.error('Upload Transactions Error:', err);
    res.status(500).json({ message: 'Failed to upload transactions' });
  }
};

// POST /api/transactions/upload
export const uploadTransactions = async (req: Request, res: Response) => {
  try {
    // Accept either a root array or an object with a transactions array
    let transactionsArray = req.body;
    if (!Array.isArray(transactionsArray)) {
      transactionsArray = req.body.transactions;
    }
    if (!Array.isArray(transactionsArray)) {
      return res.status(400).json({ message: 'Invalid transactions array' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: user not found in request' });
    }

    // Add user reference to each transaction
    const transactionsWithUser = transactionsArray.map((t: any) => ({
      ...t,
      user: req.user!.id
    }));

    await Transaction.insertMany(transactionsWithUser);
    res.status(201).json({ message: 'Transactions uploaded successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload transactions' });
  }
};
