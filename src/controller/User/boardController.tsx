import { Request, Response } from 'express';
import { Board } from '../../models/Board';

export const getPublicBoards = async (req: Request, res: Response) => {
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
        $project: {
          _id: 1,
          name: 1,
          image: 1,
          imageUrl: { $concat: [process.env.BASE_URL || '', '/', '$image'] },
          standardsCount: { $size: '$standards' },
        }
      }
    ]);

    res.json({ success: true, data: boards });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching boards'
    });
  }
};

export const getPublicBoardDetails = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params;
    
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...board.toObject(),
        imageUrl: board.image ? `${process.env.BASE_URL}/${board.image}` : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching board details'
    });
  }
};