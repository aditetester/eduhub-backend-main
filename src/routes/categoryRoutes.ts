import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { uploadCategoryImage } from "../config/multerConfig";

const router = express.Router();

router.post("/add-category", uploadCategoryImage, createCategory); 
router.get("/", getCategories);
router.put("/:id", uploadCategoryImage, updateCategory); 
router.delete("/:id", deleteCategory);

export default router;
