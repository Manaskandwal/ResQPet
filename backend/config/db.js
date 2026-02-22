const mongoose = require('mongoose');

/**
 * Connects to MongoDB Atlas using the URI from env variables.
 * Exits process on failure so the app doesn't run without a DB.
 */
const connectDB = async () => {
  try {
    console.log('[DB] Attempting to connect to MongoDB Atlas...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // fail fast if Atlas unreachable
    });
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('[DB] MongoDB connection error:', error.message);
    process.exit(1); // crash immediately — no point running without DB
  }
};

module.exports = connectDB;
