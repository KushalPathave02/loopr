import express from 'express';
import path from 'path';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || '';
mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
