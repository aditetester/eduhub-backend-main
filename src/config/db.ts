import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!, {}); 
  } catch (error) {
  
    if (error instanceof Error) {
      console.error("MongoDB connection error:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
    process.exit(1);
  }
};

export default connectDB;
