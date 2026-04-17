const mongoose = require('mongoose');
const { getMongoUri } = require('./runtime');

const connectDB = async () => {
  try {
    const mongoURI = getMongoUri();
    
    await mongoose.connect(mongoURI);
    
    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
