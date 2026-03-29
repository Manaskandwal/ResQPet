const mongoose = require('mongoose');

// Fail fast on disconnected DB instead of buffering queries indefinitely
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 10000);

let isConnecting = false;
let hasListeners = false;

/**
 * Connects to MongoDB Atlas using the URI from env variables.
 * Retries on transient failures instead of requiring a process restart.
 */
const connectDB = async () => {
  if (isConnecting) return;
  if (mongoose.connection.readyState === 1) return; // already connected
  isConnecting = true;

  try {
    if (!hasListeners) {
      hasListeners = true;
      mongoose.connection.on('connected', () => {
        console.log('[DB] MongoDB connection established.');
      });
      mongoose.connection.on('disconnected', () => {
        console.warn('[DB] MongoDB disconnected. Retrying in 3s...');
        setTimeout(() => connectDB(), 3000);
      });
      mongoose.connection.on('error', (err) => {
        console.error('[DB] MongoDB connection error:', err.message);
      });
    }

    console.log('[DB] Attempting to connect to MongoDB Atlas...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // fail fast if Atlas unreachable
      socketTimeoutMS: 20000, // stop hung operations
      maxPoolSize: 10,
      minPoolSize: 1,
      family: 4,
    });
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('[DB] MongoDB connection error:', error.message);
    // Retry instead of hard exit so transient issues don't require a restart
    setTimeout(() => connectDB(), 3000);
  } finally {
    isConnecting = false;
  }
};

module.exports = connectDB;
