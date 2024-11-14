import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticateAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
        res.status(403).json({ message: "Token is required." });
        return;
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
        if (err) {
            res.status(403).json({ message: "Invalid token." });
            return;
        }
        
        (req as any).user = user;
        next();
    });
};