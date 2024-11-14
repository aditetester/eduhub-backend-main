import { Request, Response } from "express";
import  Subject  from "../../models/Subject";
import  Standard  from "../../models/Standard";
import mongoose from "mongoose";
import fs from "fs";

// Add this interface at the top
interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

// Add this helper at the top
const addImageUrl = (subject: any) => {
  if (!subject) return subject;
  const subjectObj = subject.toObject ? subject.toObject() : subject;
  return {
    ...subjectObj,
    imageUrl: subject.image ? `${process.env.BASE_URL}/${subject.image}` : null
  };
};

export const createSubject = async (req: RequestWithFile, res: Response): Promise<Response> => {
  try {
    const { name, price } = req.body;
    const standard_id = req.params.standard_id;

    // Enhanced validation
    if (!name || price === undefined || !standard_id) {
      if (req.file?.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Name, price and standard ID are required"
      });
    }

    // Validate price is positive
    if (price < 0) {
      if (req.file?.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number"
      });
    }

    // Check if standard exists
    const standardExists = await Standard.findById(standard_id);
    if (!standardExists) {
      if (req.file?.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: "Standard not found"
      });
    }

    const subject = new Subject({
      name,
      price,
      standard: standard_id,
      image: req.file ? req.file.path : undefined
    });

    const savedSubject = await subject.save();

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: addImageUrl(savedSubject)
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Create subject error:', error);
    return res.status(500).json({
      success: false,
      message: "Error creating subject",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteSubject = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    // Add ObjectId validation
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID format"
      });
    }

    // Check for related resources before deletion
    const Resource = mongoose.model('Resource');
    const hasResources = await Resource.exists({ subject: id });
    if (hasResources) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete subject with existing resources. Please delete resources first."
      });
    }

    const deletedSubject = await Subject.findByIdAndDelete(id);
    if (!deletedSubject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    if (deletedSubject.image) {
      try {
        fs.unlinkSync(deletedSubject.image);
      } catch (error) {
        console.error('Error deleting image file:', error);
      }
    }

    return res.json({ 
      success: true, 
      message: "Subject deleted successfully" 
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Error deleting subject",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Add a new method to get subject with its resources
export const getSubjectWithResources = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID format"
      });
    }

    const subject = await Subject.findById(id)
      .populate('standard', 'grade');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    const Resource = mongoose.model('Resource');
    const resources = await Resource.find({ subject: id })
      .select('name type fileUrl');

    return res.json({
      success: true,
      data: {
        ...addImageUrl(subject),
        resources
      }
    });
  } catch (error) {
    console.error('Get subject details error:', error);
    return res.status(500).json({
      success: false,
      message: "Error fetching subject details",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getSubjects = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const standard_id = req.params.standard_id;

    const skip = (page - 1) * limit;

    // Build query
    let query = { standard: standard_id };

    // Get total count for pagination
    const total = await Subject.countDocuments(query);

    // Fetch subjects with pagination
    const subjects = await Subject.find(query)
      .populate('standard', 'grade')
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 })
      .lean()
      .then(subjects => subjects.map(subject => ({
        ...subject,
        imageUrl: subject.image ? `${process.env.BASE_URL}/${subject.image}` : null
      })));

    return res.status(200).json({
      success: true,
      data: subjects,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    return res.status(500).json({
      success: false,
      message: "Error fetching subjects",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateSubject = async (req: RequestWithFile, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID format"
      });
    }

    if (price !== undefined && price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number"
      });
    }

    const subject = await Subject.findById(id);
    if (!subject) {
      if (req.file?.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    if (req.file?.path && subject.image) {
      try {
        fs.unlinkSync(subject.image);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(price !== undefined && { price }),
      ...(req.file && { image: req.file.path })
    };

    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedSubject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: addImageUrl(updatedSubject)
    });
  } catch (error) {
    console.error('Update subject error:', error);
    return res.status(500).json({
      success: false,
      message: "Error updating subject",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};