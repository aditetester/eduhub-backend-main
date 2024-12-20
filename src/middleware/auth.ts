// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';



// Extend the Express Request type to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: any;  // Replace 'any' with a more specific type like 'User' later
    }
  }
}

// Middleware to authenticate the user
export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Log the entire authorization header
    console.log('Auth Header:', req.headers.authorization);
    
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Extracted Token:', token);

    if (!token) {
      console.log('No token provided');
      res.status(401).json({
        success: false,
        message: 'No token provided'
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      console.log('Decoded Token:', decoded);
      req.user = decoded;
      next();
    } catch (jwtError: unknown) {
      if (jwtError instanceof Error) {
        console.log('JWT Verification Failed:', jwtError.message);
      } else {
        console.log('JWT Verification Failed: Unknown error');
      }
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Middleware to check if the user is an admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};
