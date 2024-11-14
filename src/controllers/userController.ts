import { Request, Response } from "express";
import User from "../models/User";
import sendEmail from "../utils/emailSender";

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, email, password, mobileNumber } = req.body;

  try {

    const normalizedEmail = email.trim().toLowerCase();


    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({ message: "Email already in use" });
      return;
    }

    const newUser = new User({
      name,
      email: normalizedEmail,
      password,
      mobileNumber,
    });
    await newUser.save();


    await sendEmail(normalizedEmail, password);

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof Error && error.name === "ValidationError") {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};
