import express from "express";
import { getAllUsers, createUser } from "../controllers/userController";

const router = express.Router();

router.get("/", getAllUsers);
router.post("/add-user", createUser);

export default router;
