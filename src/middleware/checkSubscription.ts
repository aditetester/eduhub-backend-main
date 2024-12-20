import { Request, Response, NextFunction } from 'express';
import  User  from '../models/User';
import mongoose from 'mongoose';
import Subject from '../models/Subject';
import Subscription from '../models/Subscription';

// Add this interface
interface AuthenticatedRequest extends Request {
  subscriptionExpiry: NativeDate | undefined;
  user?: {
    id: string;
    // add other user properties you might need
  };
}

export const checkSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { subjectId } = req.params;

    if (!userId || !subjectId) {
      req.hasSubscription = false;
      return next();
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check for both subject and standard level subscriptions
    const subscription = await Subscription.findOne({
      user: userId,
      $or: [
        { 
          subject: subjectId,
          type: 'SUBJECT'
        },
        {
          standard: subject.standard,
          type: 'STANDARD'
        }
      ],
      status: 'active',
      expiryDate: { $gt: new Date() },
      paymentStatus: 'completed'
    });

    req.hasSubscription = !!subscription;
    req.subscriptionType = subscription?.type;
    next();
  } catch (error) {
    console.error('Error checking subscription:', error);
    req.hasSubscription = false;
    next();
  }
};

// Add this to your express.d.ts file
declare global {
  namespace Express {
    interface Request {
      hasSubscription?: boolean;
      subscriptionType?: string;
    }
  }
} 

export const checkSubscriptionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.hasSubscription) {
      res.status(403).json({ message: 'Subscription required' });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}; 

export const checkResourceAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthenticatedRequest).user?.id;
        const { subjectId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        // Enhanced subscription check
        const subscription = await Subscription.findOne({
            user: userId,
            $or: [
                { subject: subjectId },
                { standard: subject.standard }
            ],
            status: 'active',
            expiryDate: { $gt: new Date() },
            paymentStatus: 'completed'  // Add payment status check
        });

        // Add detailed subscription info to request
        (req as AuthenticatedRequest).hasSubscription = !!subscription;
        (req as AuthenticatedRequest).subscriptionType = subscription?.type;
        (req as AuthenticatedRequest).subscriptionExpiry = subscription?.expiryDate;
        
        next();
    } catch (error) {
        next(error);
    }
}; 