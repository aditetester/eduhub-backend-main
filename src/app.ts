import dotenv from 'dotenv';
dotenv.config();

import express, { NextFunction, Request, Response, RequestHandler } from "express";
import mongoose from "mongoose";
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
import webhookRoutes from './routes/webhook';
import { validateSubscription, validatePayment } from './validators/subscriptionValidator';
import { checkSubscriptionStatus } from './middleware/checkSubscription';
import subscriptionRoutes from './routes/subscriptionRoutes';
import { initiateSubscription, confirmSubscription } from "./controller/User/paymentController";
import { ApiError } from './utils/ApiError';
import fs from 'fs';

const app = express();

app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, '../uploads', req.url);
  console.log('File access debug:', {
    requestUrl: req.url,
    fullPath: filePath,
    exists: fs.existsSync(filePath),
    __dirname: __dirname,
    directories: fs.readdirSync(path.join(__dirname, '../uploads'))
  });
  next();
}, express.static(path.join(__dirname, '../uploads')));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3001",
    "http://localhost:3002","http://localhost:3005","http://localhost:3003"
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
app.use('/api', subscriptionRoutes);

// Webhook route (must be before json middleware)
app.use('/webhook', webhookRoutes);

// Protected routes


// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err instanceof ApiError ? err.statusCode : 500).json({
    success: false,
    error: err instanceof ApiError ? err.message : 'Internal server error'
  });
});

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
