import { Request, Response } from "express";
import Category from "../models/Category";
import Product from "../models/Product";
import User from "../models/User";

export const createCategory = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const imagePath = req.file
    ? req.file.path.replace(/\\/g, "/")
    : req.body.image;

  const fullImagePath = `${req.protocol}://${req.get("host")}/${imagePath}`;
  console.log("Full Image Path:", fullImagePath);

  const category = new Category({ name, description, image: fullImagePath });
  await category.save();
  res.status(201).json(category);
};

export const getCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      search,
      page = "1",
      limit = "5",
    } = req.query as {
      search?: string;
      page?: string;
      limit?: string;
    };

    const parsedPage = parseInt(page, 10);
    const parsedLimit = Math.min(parseInt(limit, 10), 100);
    console.log("🚀 ~ parsedLimit:", parsedLimit);

    const searchRegex =
      typeof search === "string" && search.trim() !== ""
        ? new RegExp(search, "i")
        : null;

    const query = searchRegex
      ? {
          $or: [
            { name: { $regex: searchRegex } },
            { description: { $regex: searchRegex } },
          ],
        }
      : {};

    console.log("Query:", query);
    console.log("Parsed Page:", parsedPage);
    console.log("Parsed Limit:", parsedLimit);

    const categories = await Category.find(query)
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);

    console.log("Fetched Categories:", categories); // Log fetched categories

    const total = await Category.countDocuments(query);
    console.log("🚀 ~ total:", total);

    res.status(200).json({
      categories,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: parsedPage,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedCategory = await Category.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  res.status(200).json(updatedCategory);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  await Category.findByIdAndDelete(id);
  res.status(204).send();
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const categoryCount = await Category.countDocuments();

    const productCount = await Product.countDocuments();
    const userCount = await User.countDocuments();

    res.status(200).json({
      totalCategories: categoryCount,
      totalProducts: productCount,
      totalUsers: userCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const products = await Product.find({ categoryId: id });

    res.status(200).json({ category, products });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ message: "Error fetching category" });
  }
};

