import { Request, Response } from 'express';
import { Board } from '../../models/Board';
import fs from 'fs';
import mongoose from 'mongoose';

// Add custom interface for Request with file
interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

export const getBoards = async(req: Request, res: Response) => {
  try {
    const boards = await Board.aggregate([
      {
        $lookup: {
          from: 'standards',
          foreignField: 'board',
          localField: '_id',
          as: 'standards'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          let: { standardIds: '$standards._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$standard', '$$standardIds']
                }
              }
            }
          ],
          as: 'subjects'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          image: 1,
          imageUrl: { $concat: [process.env.BASE_URL || '', '/', '$image'] },
          totalStandards: { $size: '$standards' },
          totalSubjects: { $size: '$subjects' },
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);

    res.json({ success: true, data: boards });
  } catch (error: any) {
    console.error('Error in getBoards:', error);
    res.status(500).json({ success: false, message: 'Error Fetching boards', error: error.message });
  }
};

export const createBoard = async (req: RequestWithFile, res: Response) => {
  const { name } = req.body;
  try {
    const newBoard = new Board({ 
      name,
      image: req.file ? req.file.path : undefined
    });
    
    await newBoard.save();
    
    const boardObject = newBoard.toObject();
    
    res.status(201).json({ 
      success: true, 
      data: {
        ...boardObject,
        totalStandards: 0,
        totalSubjects: 0
      } 
    });
  } catch (error: any) {
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: "Error creating board", error: error.message });
  }
};

export const updateBoard = async (req: RequestWithFile, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.file?.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ success: false, message: "Invalid board ID" });
    }

    const board = await Board.findById(id);
    if (!board) {
      if (req.file?.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ success: false, message: "Board not found" });
    }

    if (req.file?.path && board.image) {
      try {
        fs.unlinkSync(board.image);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }

    const updateData = {
      name,
      ...(req.file && { image: req.file.path })
    };

    const updatedBoard = await Board.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedBoard) {
      throw new Error('Failed to update board');
    }

    const counts = await Board.aggregate([
      { 
        $match: { _id: new mongoose.Types.ObjectId(id) }
      },
      {
        $lookup: {
          from: 'standards',
          localField: '_id',
          foreignField: 'board',
          as: 'standards'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'standards._id',
          foreignField: 'standard',
          as: 'subjects'
        }
      },
      {
        $project: {
          totalStandards: { $size: '$standards' },
          totalSubjects: { $size: '$subjects' }
        }
      }
    ]);

    const { totalStandards, totalSubjects } = counts[0] || { totalStandards: 0, totalSubjects: 0 };

    res.json({ 
      success: true, 
      data: {
        ...updatedBoard.toObject(),
        totalStandards,
        totalSubjects
      } 
    });
  } catch (error: any) {
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: "Error updating board", error: error.message });
  }
};

export const deleteBoard = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid board ID" });
    }

    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }

    if (board.image) {
      try {
        fs.unlinkSync(board.image);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    await board.deleteOne();

    res.json({ success: true, message: "Board deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Error deleting board", error: error.message });
  }
};