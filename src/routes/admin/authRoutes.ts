import express from "express";
import { login } from "../../controller/Admin/adminController";

const router = express.Router();

router.post("/login", login);

export default router;