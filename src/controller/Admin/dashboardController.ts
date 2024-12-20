import { Request, Response } from "express";
import Resource from "../../models/Resource";
import Purchase from "../../models/Purchase";
import  User from "../../models/User";
import Subject from "../../models/Subject";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Get total students with monthly growth
    const totalStudents = await User.countDocuments({ role: 'student' });
    const lastMonthStudents = await User.countDocuments({
      role: 'student',
      createdAt: {
        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
      }
    });

    // Get resource stats
    const resourceStats = await Resource.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          views: { $sum: '$views' }
        }
      }
    ]);

    // Get monthly revenue with growth
    const currentMonth = new Date().getMonth() + 1;
    const monthlyRevenue = await Purchase.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), currentMonth - 1, 1)
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const lastMonthRevenue = await Purchase.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), currentMonth - 2, 1),
            $lt: new Date(new Date().getFullYear(), currentMonth - 1, 1)
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        students: {
          total: totalStudents,
          monthlyGrowth: ((lastMonthStudents / totalStudents) * 100).toFixed(1)
        },
        resources: resourceStats,
        revenue: {
          monthly: monthlyRevenue[0]?.total || 0,
          growth: lastMonthRevenue[0]?.total 
            ? (((monthlyRevenue[0]?.total - lastMonthRevenue[0]?.total) / lastMonthRevenue[0]?.total) * 100).toFixed(1)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats'
    });
  }
};

export const getPopularResources = async (req: Request, res: Response) => {
  try {
    const popularResources = await Resource.aggregate([
      {
        $sort: { views: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subjectId',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $lookup: {
          from: 'boards',
          localField: 'boardId',
          foreignField: '_id',
          as: 'board'
        }
      },
      {
        $project: {
          name: 1,
          type: 1,
          views: 1,
          downloads: 1,
          status: 1,
          'subject.name': 1,
          'board.name': 1,
          standard: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: popularResources
    });
  } catch (error) {
    console.error('Popular resources error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular resources'
    });
  }
};

export const getRecentPurchases = async (req: Request, res: Response) => {
  try {
    const recentPurchases = await Purchase.aggregate([
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subjectId',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $project: {
          amount: 1,
          status: 1,
          createdAt: 1,
          type: 1,
          'user.name': 1,
          'subject.name': 1,
          'standard': 1
        }
      }
    ]);

    res.json({
      success: true,
      data: recentPurchases
    });
  } catch (error) {
    console.error('Recent purchases error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent purchases'
    });
  }
};

export const getSubjectRevenue = async (req: Request, res: Response) => {
  try {
    const subjectRevenue = await Purchase.aggregate([
      {
        $match: {
          subjectId: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$subjectId',
          revenue: { $sum: '$amount' },
          studentCount: { $addToSet: '$userId' }
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $project: {
          revenue: 1,
          studentCount: { $size: '$studentCount' },
          'subject.name': 1,
          'subject.standard': 1
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      success: true,
      data: subjectRevenue
    });
  } catch (error) {
    console.error('Subject revenue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subject revenue'
    });
  }
};

export const getBoardwiseStats = async (req: Request, res: Response) => {
  try {
    // Get student distribution
    const studentStats = await User.aggregate([
      {
        $match: { role: 'student' }
      },
      {
        $group: {
          _id: '$boardId',
          activeStudents: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'active'] },
                1,
                0
              ]
            }
          },
          totalStudents: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'boards',
          localField: '_id',
          foreignField: '_id',
          as: 'board'
        }
      }
    ]);

    // Get revenue by board
    const revenueStats = await Purchase.aggregate([
      {
        $group: {
          _id: '$boardId',
          totalRevenue: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'boards',
          localField: '_id',
          foreignField: '_id',
          as: 'board'
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        students: studentStats,
        revenue: revenueStats
      }
    });
  } catch (error) {
    console.error('Board-wise stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch board-wise stats'
    });
  }
};