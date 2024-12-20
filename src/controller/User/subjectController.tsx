import { Request, Response } from "express";
import Subject from "../../models/Subject";
import mongoose from "mongoose";
import Subscription from "../../models/Subscription";

// Helper function for image URL
const addImageUrl = (subject: any) => {
  if (!subject) return subject;
  const subjectObj = subject.toObject ? subject.toObject() : subject;
  return {
    ...subjectObj,
    imageUrl: subject.image ? `${process.env.BASE_URL}/${subject.image.replace(/\\/g, '/')}` : null
  };
};

// Fix 1: Add custom interface to extend Request
interface AuthRequest extends Request {
  user?: {
    id: string;
    // add other user properties if needed
  };
}

// Get all subjects for a specific standard
export const getSubjectsByStandard = async (req: Request, res: Response) => {
  try {
    const { standardId } = req.params;
    
    const subjects = await Subject.find({ standard: standardId })
      .populate('standard', 'grade')
      .lean();

    const formattedSubjects = subjects.map(subject => addImageUrl(subject));

    res.json({
      success: true,
      data: formattedSubjects
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects'
    });
  }
};

// Get subject details by ID
export const getSubjectDetails = async (req: AuthRequest, res: Response) => {
  // Add validation for user authentication
  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  try {
    const { subject_id } = req.params;
    const userId = req.user.id;

    // Get subject with resources
    const subject = await Subject.findById(subject_id)
      .populate('standard', 'grade')
      .populate('resources'); // Make sure resources are populated

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    // Check both subject and standard level subscriptions
    const subscription = await Subscription.findOne({
      user: userId,
      $or: [
        { subject: subject_id, type: 'SUBJECT' },
        { standard: subject.standard._id, type: 'STANDARD' }
      ],
      status: 'active',
      expiryDate: { $gt: new Date() },
      paymentStatus: 'completed'
    });

    // Process resources based on subscription
    let resources = [...subject.resources];
    if (!subscription) {
      const visibleCount = Math.ceil(resources.length / 2);
      resources = resources.map((resource: any, index) => {
        if (index < visibleCount) {
          return resource;
        }
        return {
          _id: resource._id,
          name: resource.name,
          isLocked: true,
          // Remove sensitive/premium content
          content: null,
          downloadUrl: null
        };
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...subject.toObject(),
        imageUrl: subject.image ? `${process.env.BASE_URL}/${subject.image}` : null,
        resources,
        subscriptionStatus: {
          isSubscribed: !!subscription,
          type: subscription?.type || null,
          expiryDate: subscription?.expiryDate || null
        }
      }
    });
  } catch (error) {
    console.error('Error in getSubjectDetails:', error);
    return res.status(500).json({
      success: false,
      message: "Error fetching subject details",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Search subjects
export const searchSubjects = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const searchQuery = query 
      ? { name: { $regex: query as string, $options: 'i' } }
      : {};

    const total = await Subject.countDocuments(searchQuery);
    
    const subjects = await Subject.find(searchQuery)
      .populate('standard', 'grade')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: subjects.map(subject => addImageUrl(subject)),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error searching subjects",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 