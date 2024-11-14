import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv"; 
import boardRoutes from "./routes/admin/boardRoutes";
import standardRoutes from "./routes/admin/standardRoutes";
import subjectRoutes from "./routes/admin/subjectRoutes";
import resourceRoutes from "./routes/admin/resourceRoutes";
import authRoutes from "./routes/admin/authRoutes";
import userRoutes from "./routes/admin/userRoutes";


import purchaseRoutes from "./routes/admin/purchaseRoutes";
import cors from "cors";
import path from 'path';
import dashboardRoutes from "./routes/admin/dashboardRoutes";
import UserRoutes from './routes/User/index';

dotenv.config(); 

const app = express();

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3001",
    "http://localhost:3002"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use("/admin", authRoutes);


app.use("/admin", boardRoutes);
app.use("/admin", userRoutes);
app.use("/admin", standardRoutes);
app.use("/admin", subjectRoutes);
app.use("/admin", resourceRoutes);
app.use('/admin/dashboard', dashboardRoutes);

app.use("/admin", purchaseRoutes);

// Public routes (no authentication required)
app.use('/api', UserRoutes);

// Admin routes (with authentication)


// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

const mongoUri = process.env.MONGO_URI || "mongodb://localhost/education-hub";

mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to the database"))
  .catch((err) => console.error("Database connection failed:", err));

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
