import { Request, Response } from "express";
import Product from "../models/Product";

export const createProduct = async (req: Request, res: Response) => {
  const { name, description, availableQuantity, price, category } = req.body;
  const imagePath = req.file ? req.file.path : req.body.image;
 

  const product = new Product({
    name,
    description,
    availableQuantity,
    price,
    category,
    image: imagePath,
  });
  await product.save();
  res.status(201).json(product);
};


export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let products;

    if (typeof search === "string" && search.trim() !== "") {
      const searchRegex = new RegExp(search, "i"); 
      console.log("Search Regex:", searchRegex);

      products = await Product.find({
        $or: [
          { name: { $regex: searchRegex } }, 
          { description: { $regex: searchRegex } }, 
        ],
      }).populate("category");

      console.log("Filtered Products:", products);
    } else {
      products = await Product.find().populate("category");
      console.log("All Products:", products);
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products" });
  }
};


export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  res.status(200).json(updatedProduct);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  await Product.findByIdAndDelete(id);
  res.status(204).send();
};
