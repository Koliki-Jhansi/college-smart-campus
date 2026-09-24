const mongoose = require('mongoose');

const getSafeHost = (uri) => {
  if (!uri) return 'unknown';
  try {
    // If it's a mongo connection string with credentials, mask password
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  } catch {
    return 'configured database host';
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/collegehub';
  const isAtlas = uri.includes('mongodb+srv://') || uri.includes('cluster');

  try {
    // Attempt standard MongoDB connection with 5-second timeout
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
    });
    if (isAtlas) {
      console.log('[Database] MongoDB Atlas connected successfully.');
    } else {
      console.log(`[Database] MongoDB Connected to live instance: ${conn.connection.host}`);
    }
    return conn;
  } catch (liveErr) {
    console.warn(`[Database] Could not connect to persistent MongoDB instance at ${getSafeHost(uri)}.`);
    console.log('[Database] ⚠️ Notice: Initializing temporary in-memory MongoDB fallback...');
    console.log('[Database] 💡 To persist data permanently, verify your MONGODB_URI in server/.env (e.g. MongoDB Atlas connection string).');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      const memoryConn = await mongoose.connect(memoryUri);
      console.log(`[Database] Connected to In-Memory MongoDB for development.`);
      return memoryConn;
    } catch (memErr) {
      console.error('[Database] Failed to start embedded MongoDB Memory Server:', memErr.message);
      throw memErr;
    }
  }
};

module.exports = connectDB;
