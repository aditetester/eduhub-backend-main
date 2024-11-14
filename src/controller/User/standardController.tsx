import { Request, Response } from 'express';
import Standard from '../../models/Standard';
import mongoose from 'mongoose';

export const getPublicStandards = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params;
    
    const standards = await Standard.find({ board: boardId })
      .select('name grade price image') // Added 'name' here
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
    res.status(500).json({
      success: false,
      message: 'Error fetching standards'
    });
  }
};

export const getPublicStandardDetails = async (req: Request, res: Response) => {
  try {
    const { standardId } = req.params;

    const standard = await Standard.findById(standardId)
      .populate('board', 'name')
      .lean();

    if (!standard) {
      return res.status(404).json({
        success: false,
        message: 'Standard not found'
      });
    }

    // Get subjects for this standard (assuming you have subjects)
    const Subject = mongoose.model('Subject');
    const subjects = await Subject.find({ standard: standardId })
      .select('name price')
      .lean();

    res.json({
      success: true,
      data: {
        ...standard,
        imageUrl: standard.image ? `${process.env.BASE_URL}/${standard.image}` : null,
        subjects
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching standard details'
    });
  }
};