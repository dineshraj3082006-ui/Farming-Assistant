/* ==========================================================================
   KRISHIMITRA AI - MongoDB Connection Manager
   Connects to local MongoDB or MongoDB Atlas with auto-retry and safe fallback.
   ========================================================================== */

const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return true;
  }

  const mongoURI = (process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/krishimitra').trim();

  try {
    console.log(`[MongoDB] Connecting to database: ${mongoURI.replace(/:[^:]*@/, ':****@')}...`);
    const conn = await mongoose.connect(mongoURI, {
      dbName: 'krishimitra',
      serverSelectionTimeoutMS: 10000 // 10s timeout for cloud Atlas connections
    });

    isConnected = conn.connection.readyState === 1;
    console.log(`🍃 [MongoDB Connected] Database: ${conn.connection.name} on ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.warn(`⚠️ [MongoDB Notice] Could not connect to MongoDB (${err.message}). Running with local in-memory persistence fallback.`);
    isConnected = false;
    return false;
  }
}

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

async function ensureDbConnected() {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }
  return await connectDB();
}

module.exports = {
  connectDB,
  isDbConnected,
  ensureDbConnected
};

