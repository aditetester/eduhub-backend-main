import { Request, Response } from "express";
import { User } from "../../models/User";
import bcrypt from "bcrypt";

// Get all users
export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-password'); // Exclude password from response
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
};

// Get single user by ID
export const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user" });
    }
};

// Create new user
export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || "student" // defaults to student if not specified
        });

        await user.save();

        // Return user without password
        const userResponse = user.toObject();
        const { password: _, ...userWithoutPassword } = userResponse;
        
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: "Error creating user" });
    }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user" });
    }
};