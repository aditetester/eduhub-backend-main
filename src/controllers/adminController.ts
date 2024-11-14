import { Request, Response } from "express";
import Category from "../models/Category";
import Product from "../models/Product"; 
import User from "../models/User"; 

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
