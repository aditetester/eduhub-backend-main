import { Request, Response } from 'express';
import Standard from '../../models/Standard';
import mongoose from 'mongoose';
import fs from 'fs';

export const createStandard = async (req: Request, res: Response) => {
  try {
    const { grade, price } = req.body;
    const boardId = req.body.board || req.params.board_id;

    // Validate required fields
    if (!grade || !price || !boardId) {
      return res.status(400).json({
        success: false,
        message: "Grade, price, and board ID are required"
      });
    }

    // Validate price is positive
    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number"
      });
    }

    const standard = new Standard({
      grade,
      price,
      board: boardId,
      image: req.file ? req.file.path : undefined
    });

    const savedStandard = await standard.save();

    res.status(201).json({
      success: true,
      message: "Standard created successfully",
      data: savedStandard
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Create standard error:', error);
    res.status(500).json({
      success: false,
      message: "Error creating standard",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getStandards = async (req: Request, res: Response) => {
  try {
    const boardId = req.params.board_id;

    const standards = await Standard.find({ board: boardId })
      .select('grade price board image')
      .populate('board', 'name')
      .sort('grade')
      .lean()
      .then(standards => standards.map(standard => ({
        ...standard,
        imageUrl: standard.image ? `${process.env.BASE_URL}/${standard.image}` : null
      })));

    res.json({
      success: true,
      data: standards
    });
  } catch (error) {
    console.error('Get standards error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching standards",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateStandard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { grade, price } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid standard ID format"
      });
    }

    // Validate price if provided
    if (price !== undefined && price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number"
      });
    }

    const standard = await Standard.findById(id);
    if (req.file?.path && standard?.image) {
      try {
        fs.unlinkSync(standard.image);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }

    const updateData = {
      ...(grade && { grade }),
      ...(price !== undefined && { price }),
      ...(req.file && { image: req.file.path })
    };

    const updatedStandard = await Standard.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedStandard) {
      return res.status(404).json({
        success: false,
        message: "Standard not found"
      });
    }

    res.json({
      success: true,
      message: "Standard updated successfully",
      data: updatedStandard
    });
  } catch (error) {
    console.error('Update standard error:', error);
    res.status(500).json({
      success: false,
      message: "Error updating standard",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteStandard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid standard ID format"
      });
    }

    // Check if standard exists
    const standard = await Standard.findById(id);
    if (!standard) {
      return res.status(404).json({
        success: false,
        message: "Standard not found"
      });
    }

    // Check for related subjects
    const Subject = mongoose.model('Subject');
    const hasSubjects = await Subject.exists({ standard: id });
    if (hasSubjects) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete standard with existing subjects. Please delete subjects first."
      });
    }

    if (standard.image) {
      try {
        fs.unlinkSync(standard.image);
      } catch (error) {
        console.error('Error deleting image file:', error);
      }
    }

    await Standard.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Standard deleted successfully"
    });
  } catch (error) {
    console.error('Delete standard error:', error);
    res.status(500).json({
      success: false,
      message: "Error deleting standard",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Optional: Get standard with its subjects
export const getStandardWithSubjects = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid standard ID format"
      });
    }

    const standard = await Standard.findById(id)
      .populate({
        path: 'board',
        select: 'name'
      });

    if (!standard) {
      return res.status(404).json({
        success: false,
        message: "Standard not found"
      });
    }

    // Get subjects for this standard
    const Subject = mongoose.model('Subject');
    const subjects = await Subject.find({ standard: id })
      .select('name price');

    res.json({
      success: true,
      data: {
        ...standard.toObject(),
        subjects
      }
    });
  } catch (error) {
    console.error('Get standard with subjects error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching standard details",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Optional: Calculate total price for a standard (including all subjects)
export const getStandardTotalPrice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid standard ID format"
      });
    }

    const standard = await Standard.findById(id);
    if (!standard) {
      return res.status(404).json({
        success: false,
        message: "Standard not found"
      });
    }

    const Subject = mongoose.model('Subject');
    const subjects = await Subject.find({ standard: id })
      .select('price');

    const subjectsTotal = subjects.reduce((sum, subject) => sum + subject.price, 0);
    const totalPrice = standard.price + subjectsTotal;

    res.json({
      success: true,
      data: {
        standardPrice: standard.price,
        subjectsTotal,
        totalPrice
      }
    });
  } catch (error) {
    console.error('Get standard total price error:', error);
    res.status(500).json({
      success: false,
      message: "Error calculating total price",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};