import { Request, Response } from 'express';
import Purchase from '../../models/Purchase';
import Standard from '../../models/Standard';
import Subject from '../../models/Subject';
import mongoose from 'mongoose';

export const createSubjectPurchase = async (req: Request, res: Response) => {
    try {
        const { userId, resourceId } = req.body;
        console.log('1. Received request:', { userId, resourceId });

        // Input validation
        if (!userId || !resourceId) {
            console.log('2. Missing fields');
            return res.status(400).json({
                success: false,
                message: "Missing required fields: userId and resourceId are required"
            });
        }

        const subject = await Subject.findById(resourceId);
        console.log('3. Found subject:', subject);

        if (!subject) {
            console.log('4. Subject not found');
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        // Check for existing active purchase
        const existingPurchase = await Purchase.findOne({
            user: userId,
            subject: resourceId,
            validUntil: { $gt: new Date() }
        });
        console.log('5. Existing purchase check:', existingPurchase);

        if (existingPurchase) {
            console.log('6. Purchase already exists');
            return res.status(400).json({
                success: false,
                message: "Active purchase already exists for this subject"
            });
        }

        // Create purchase object
        const purchase = new Purchase({
            user: userId,
            subject: resourceId,
            amount: subject.price,
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            paymentStatus: 'COMPLETED',
            purchaseType: 'SUBJECT'
        });
        console.log('7. Created purchase object:', purchase);

        // Save purchase
        await purchase.save();
        console.log('8. Saved purchase successfully');

        // Populate subject details
        await purchase.populate('subject', 'name price');
        console.log('9. Populated subject details');

        return res.status(201).json({
            success: true,
            data: {
                _id: purchase._id,
                user: purchase.user,
                subject: purchase.subject,
                amount: purchase.amount,
                validUntil: purchase.validUntil,
                paymentStatus: purchase.paymentStatus,
                purchaseType: purchase.purchaseType,
                createdAt: purchase.createdAt,
                updatedAt: purchase.updatedAt
            }
        });

    } catch (error) {
        console.error('ERROR in purchase creation:', error);
        res.status(500).json({ 
            success: false,
            message: "Failed to create subject purchase",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const createStandardPurchase = async (req: Request, res: Response) => {
    try {
        const { userId, resourceId } = req.body;

        // Input validation
        if (!userId || !resourceId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: userId and resourceId are required"
            });
        }

        const standard = await Standard.findById(resourceId);
        if (!standard) {
            return res.status(404).json({
                success: false,
                message: "Standard not found"
            });
        }

        // Check for existing active purchase
        const existingPurchase = await Purchase.findOne({
            user: userId,
            standard: resourceId,
            validUntil: { $gt: new Date() }
        });

        if (existingPurchase) {
            return res.status(400).json({
                success: false,
                message: "Active purchase already exists for this standard"
            });
        }

        // Set default duration (30 days)
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);

        const purchase = new Purchase({
            user: userId,
            standard: resourceId,
            amount: standard.price,
            validUntil,
            paymentStatus: 'COMPLETED',
            purchaseType: 'STANDARD'
        });
        
        await purchase.save();
        await purchase.populate('standard', 'grade price');
        
        return res.status(201).json({
            success: true,
            data: {
                _id: purchase._id,
                user: purchase.user,
                standard: purchase.standard,
                amount: purchase.amount,
                validUntil: purchase.validUntil,
                paymentStatus: purchase.paymentStatus,
                purchaseType: purchase.purchaseType,
                createdAt: purchase.createdAt,
                updatedAt: purchase.updatedAt
            }
        });

    } catch (error) {
        console.error('Standard purchase creation error:', error);
        res.status(500).json({ 
            success: false,
            message: "Failed to create standard purchase",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const checkSubjectOrStandardExpiration = async (req: Request, res: Response) => {
    try {
        // Add your expiration check logic here
        const { userId, purchaseId } = req.params;
        // Implementation for checking expiration
        res.status(200).json({ message: "Expiration check completed" });
    } catch (error) {
        res.status(500).json({ error: "Failed to check expiration" });
    }
};

export const getUserPurchases = async (req: Request, res: Response) => {
  try {
    console.log('Request params:', req.params);
    const { userId } = req.params;

    console.log('UserId received:', userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format"
      });
    }

    const purchases = await Purchase.find({ user: userId })
      .populate('standard', 'grade price')
      .populate('subject', 'name price')
      .sort('-createdAt');

    console.log('Found purchases:', purchases);

    return res.status(200).json({
      success: true,
      data: purchases
    });

  } catch (error) {
    console.error('Get purchases error:', error);
    return res.status(500).json({
      success: false,
      message: "Error fetching purchases",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const verifyAccess = async (req: Request, res: Response) => {
  try {
    const { resourceId } = req.params;
    const { userId } = req.query; // Get userId from query params

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const resource = await mongoose.model('Resource').findById(resourceId)
      .populate('subject');
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found"
      });
    }

    // Check if user has purchased either the subject or the standard
    const hasAccess = await Purchase.findOne({
      user: userId,
      paymentStatus: 'COMPLETED',
      validUntil: { $gt: new Date() },
      $or: [
        { subject: resource.subject._id },
        { standard: resource.subject.standard }
      ]
    });

    res.json({
      success: true,
      hasAccess: !!hasAccess
    });

  } catch (error) {
    console.error('Verify access error:', error);
    res.status(500).json({
      success: false,
      message: "Error verifying access",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createPurchase = async (req: Request, res: Response) => {
    try {
        const { userId, type, resourceId } = req.body;
        
        // Set default duration (30 days)
        const duration = 30;
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + duration);

        let amount;
        if (type === 'subject') {
            const subject = await Subject.findById(resourceId);
            if (!subject) {
                return res.status(404).json({
                    success: false,
                    message: "Subject not found"
                });
            }
            amount = subject.price;
            
            const purchase = new Purchase({
                user: userId,
                subject: resourceId,
                amount,
                validUntil,
                paymentStatus: 'COMPLETED'
            });
            await purchase.save();
            
            return res.status(201).json({
                success: true,
                data: purchase
            });
            
        } else if (type === 'standard') {
            const standard = await Standard.findById(resourceId);
            if (!standard) {
                return res.status(404).json({
                    success: false,
                    message: "Standard not found"
                });
            }
            amount = standard.price;
            
            const purchase = new Purchase({
                user: userId,
                standard: resourceId,
                amount,
                validUntil,
                paymentStatus: 'COMPLETED'
            });
            await purchase.save();
            
            return res.status(201).json({
                success: true,
                data: purchase
            });
        } else {
            return res.status(400).json({ 
                success: false,
                message: "Invalid purchase type. Must be 'subject' or 'standard'" 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Failed to create purchase",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getPurchasesByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.query; // Get type from query parameters
    let query = {};
    
    if (type === 'SUBJECT' || type === 'STANDARD') {
      query = { purchaseType: type };
    }

    const purchases = await Purchase.find(query)
      .populate('user', 'name email')
      .populate('subject', 'name image price')
      .populate('standard', 'grade price')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: purchases
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchases",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};