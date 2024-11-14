import express from "express";
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { uploadProductImage } from "../config/multerConfig";

const router = express.Router();

router.post("/add-product", uploadProductImage, createProduct); 
router.get("/", getProducts);
router.put("/:id", uploadProductImage, updateProduct);
router.delete("/:id", deleteProduct);

export default router;
