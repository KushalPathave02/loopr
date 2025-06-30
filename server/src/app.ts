import express from 'express';
import path from 'path';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://loopr-1.onrender.com',  // previous render deployment
  'https://loopr.vercel.app' // Vercel deployment
];

app.use(cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
}));

// Health check route
app.get('/', (_req, res) => {
  res.send('Financial Analytics Dashboard API');
});

// Routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import transactionRoutes from './routes/transactions';
import exportRoutes from './routes/export';
import analyticsRoutes from './routes/analytics';
import geminiRoutes from './routes/gemini';
import settingsRoutes from './routes/settings';
import usersRoute from './routes/users';
import walletRoute from './routes/wallet';
import messagesRoutes from './routes/messages';

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/gemini-chat', geminiRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', usersRoute);
app.use('/api/wallet', walletRoute);
app.use('/api/messages', messagesRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

export default app;
