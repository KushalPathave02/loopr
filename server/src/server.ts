import app from './app';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || '';

if (!mongoUri) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

console.log('Attempting to connect to MongoDB...');
mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected successfully.');
    // Start server only after a successful database connection
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
