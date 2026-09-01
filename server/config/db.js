const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_db';

  try {
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    isConnected = true;
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[DB] Primary MongoDB connection failed: ${error.message}`);
    
    // Only attempt local in-memory fallback when not on Vercel production
    if (process.env.VERCEL !== '1') {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const fallbackUri = mongoServer.getUri();
        const conn = await mongoose.connect(fallbackUri);
        isConnected = true;
        console.log(`[DB] Fallback In-Memory MongoDB Connected at: ${fallbackUri}`);
      } catch (fallbackErr) {
        console.error(`[DB ERROR] All MongoDB connections failed: ${fallbackErr.message}`);
      }
    }
  }
};

module.exports = connectDB;
