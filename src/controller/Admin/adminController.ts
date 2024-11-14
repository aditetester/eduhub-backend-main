import { Request, Response } from "express";
import jwt from "jsonwebtoken";

export const login = (req: Request, res: Response): void => {
    const { username, password } = req.body;

    // Hardcoded admin credentials
    const adminCredentials = { username: "admin", password: "admin123" };

    if (
        username === adminCredentials.username &&
        password === adminCredentials.password
    ) {
        try {
            const token = jwt.sign({ username }, process.env.JWT_SECRET as string, {
                expiresIn: "24h",
            });
            res.json({ token });
        } catch (error) {
            res.status(500).json({ message: "Error generating token" });
        }
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
};