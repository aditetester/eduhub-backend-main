import express from "express";
import { getUsers, getUserById, createUser, deleteUser } from "../../controller/Admin/userController";


const router = express.Router();

// Public routes
router.post("/user", createUser as express.RequestHandler);  // Allow user registration without authentication

// Protected routes (admin only)
router.get("/user", getUsers as express.RequestHandler);
router.get("/user/:id", getUserById as express.RequestHandler);
router.delete("/user/:id", deleteUser as express.RequestHandler);

export default router;