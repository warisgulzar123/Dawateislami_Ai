const mongoose = require('mongoose');

/**
 * Connects to MongoDB database using MONGODB_URI environment variable
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host} (Database: ${conn.connection.name})`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
