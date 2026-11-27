const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    // If DB connection fails, log error but keep server running
    console.error(`MongoDB connection failed: ${error.message}`);
    // Do not exit process to keep API routes available
    return;
  }
};

module.exports = connectDB;
