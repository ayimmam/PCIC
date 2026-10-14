import mongoose from "mongoose";

let pendingConnection;
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");
  if (!pendingConnection) {
    pendingConnection = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      ...(process.env.MONGODB_URI.startsWith("mongodb+srv://") ? { tls: true, tlsAllowInvalidCertificates: false } : {}),
    }).then((conn) => {
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn;
    }).catch((error) => {
      pendingConnection = undefined;
      throw error;
    });
  }
  return pendingConnection;
};

export default connectDB;
