import { Request, Response } from "express";
import Subject from "../../models/Subject";
import mongoose from "mongoose";

// Helper function for image URL
const addImageUrl = (subject: any) => {
  if (!subject) return subject;
  const subjectObj = subject.toObject ? subject.toObject() : subject;
  return {
    ...subjectObj,
    imageUrl: subject.image ? `${process.env.BASE_URL}/${subject.image}` : null
  };
};

// Get all subjects for a specific standard
export const getSubjectsByStandard = async (req: Request, res: Response) => {
  try {
    const { standard_id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(standard_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid standard ID format"
      });
    }

    const subjects = await Subject.find({ standard: standard_id })
      .populate('standard', 'grade')
      .sort({ name: 1 });

    const formattedSubjects = subjects.map(subject => addImageUrl(subject));

    return res.status(200).json({
      success: true,
      data: formattedSubjects
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching subjects",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get subject details by ID
export const getSubjectDetails = async (req: Request, res: Response) => {
  try {
    const { subject_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subject_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID format"
      });
    }

    const subject = await Subject.findById(subject_id)
      .populate('standard', 'grade');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    // Get related subjects from the same standard
    const relatedSubjects = await Subject.find({
      standard: subject.standard,
      _id: { $ne: subject_id }
    })
    .limit(3)
    .select('name image price');

    return res.status(200).json({
      success: true,
      data: {
        ...addImageUrl(subject),
        relatedSubjects: relatedSubjects.map(sub => addImageUrl(sub))
      }
    });
  } catch (error) {
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