import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: false,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Do not call process.exit(1) in a serverless environment
  }
};

export default connectDB;
