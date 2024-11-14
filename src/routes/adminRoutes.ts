import express, { Request, Response, Router } from "express";
import { getDashboardStats } from "../controllers/adminController";
const router: Router = express.Router();

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";

router.get("/test", (req: Request, res: Response) => {
  return res.status(200).json({ message: "Test route is working!" });
});

router.post("/login", (req: Request, res: Response) => {
  console.log("Login request received:", req.body);
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return res.status(200).json({ message: "Login successful" });
  }

  return res.status(401).json({ message: "Invalid credentials" });
});

router.get("/dashboard", getDashboardStats);

export default router;
