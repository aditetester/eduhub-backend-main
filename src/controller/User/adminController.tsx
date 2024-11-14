import { Request, Response } from "express";
import { User } from "../../models/User";
import bcrypt from "bcrypt";

// Login controller (without token generation)
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Return user info (excluding password)
        const userResponse = user.toObject();
        const { password: _, ...userWithoutPassword } = userResponse;

        res.status(200).json({
            user: userWithoutPassword
        });
    } catch (error) {
        res.status(500).json({ message: "Error during login" });
    }
};

// Register new user (without token generation)
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user (default role is student)
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: "student"
        });

        await user.save();

        // Return user info (excluding password)
        const userResponse = user.toObject();
        const { password: _, ...userWithoutPassword } = userResponse;

        res.status(201).json({
            user: userWithoutPassword
        });
    } catch (error) {
        res.status(500).json({ message: "Error during registration" });
    }
};

// Update user profile (no authentication needed)
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { name, email } = req.body;

        // Assuming userId is provided in the request body (no authentication middleware)
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;

        await user.save();

        // Return updated user (excluding password)
        const userResponse = user.toObject();
        const { password: _, ...userWithoutPassword } = userResponse;

        res.status(200).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: "Error updating profile" });
    }
};

// Change password (no authentication)
export const changePassword = async (req: Request, res: Response) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        // Hash and save new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error changing password" });
    }
};

// Get user profile (no authentication)
export const getProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body; // Assuming userId is sent in the request body

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching profile" });
    }
};
