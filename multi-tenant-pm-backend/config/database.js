const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    console.log('MONGO_URI:', uri); // TEMP: debug

    const conn = await mongoose.connect(uri, {
      // new mongoose versions ke liye options optional hain
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
