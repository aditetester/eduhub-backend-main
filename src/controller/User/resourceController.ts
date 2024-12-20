import { Request, Response, RequestHandler } from "express";
import Resource from "../../models/Resource";
import  User  from "../../models/User";
import { Types } from "mongoose";
import Subscription from "../../models/Subscription";

// Define an interface for the resource type if you haven't already
interface IResourceDocument {
  _id: Types.ObjectId;
  name: string;
  content?: string;
  downloadUrl?: string;
  isFree: boolean;
  type: string;
  // add other properties as needed
}

export const getResources: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
     const { subjectId } = req.query;

    const resources = await Resource.find({ subject: subjectId })
      .populate('board', 'name')
      .populate('standard', 'grade')
      .populate('subject', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const transformedResources = resources.map(resource => ({
      _id: resource._id.toString(),
      name: resource.name,
      description: resource.description,
      type: resource.type,
      board: typeof resource.board === 'object' && 'name' in resource.board ? resource.board.name : null,
      standard: typeof resource.standard === 'object' && 'grade' in resource.standard ? resource.standard.grade : null,
      subject: typeof resource.subject === 'object' && 'name' in resource.subject ? resource.subject.name : null,
      fileUrl: resource.type === 'PDF' 
        ? `http://localhost:3000/${resource.fileUrl?.replace(/^\/+/, '')}`
        : resource.fileUrl,
      videoUrl: resource.videoUrl,
      thumbnailUrl: resource.thumbnailUrl 
        ? `http://localhost:3000/${resource.thumbnailUrl.replace(/^\/+/, '')}`
        : null,
      size: resource.size,
      duration: resource.duration,
      createdAt: resource.createdAt,
      boardId: resource.board?._id.toString() || null,
      standardId: resource.standard?._id.toString() || null,
      subjectId: resource.subject?._id.toString() || null,
      isLocked: false
    }));

    res.json({
      success: true,
      data: transformedResources
    });
  } catch (error) {
    console.error('Error in getResources:', error);
    res.status(500).json({ 
      success: false, 
      error: "Error fetching resources" 
    });
  }
};

export const getResourceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const resource = await Resource.findById(id)
      .populate('board', 'name')
      .populate('standard', 'grade')
      .populate('subject', 'name')
      .lean();

    if (!resource) {
      res.status(404).json({
        success: false,
        error: "Resource not found"
      });
      return;
    }

    const transformedResource = {
      ...resource,
      _id: resource._id.toString(),
      fileUrl: resource.type === 'PDF' 
        ? `http://localhost:3000/${resource.fileUrl?.replace(/^\/+/, '')}`
        : resource.fileUrl,
      thumbnailUrl: resource.thumbnailUrl 
        ? `http://localhost:3000/${resource.thumbnailUrl.replace(/^\/+/, '')}`
        : null
    };

    res.json({
      success: true,
      data: transformedResource
    });
  } catch (error) {
    console.error('Error in getResourceById:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching resource"
    });
  }
};





export const searchResources = async (req: Request, res: Response) => {
  try {
    const { query, board, standard, subject, type } = req.query;
    
    let searchQuery: any = {};
    
    // Add text search if query parameter exists
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    // Add filters
    if (board) searchQuery.board = board;
    if (standard) searchQuery.standard = standard;
    if (subject) searchQuery.subject = subject;
    if (type) searchQuery.type = type.toString().toUpperCase();

    const resources = await Resource.find(searchQuery)
      .populate('board', 'name')
      .populate('standard', 'grade')
      .populate('subject', 'name')
      .lean();

    const transformedResources = resources.map(resource => ({
      _id: resource._id.toString(),
      name: resource.name,
      description: resource.description,
      type: resource.type,
      board: resource.board && typeof resource.board === 'object' && 'name' in resource.board ? resource.board.name : resource.board,
      standard: resource.standard && typeof resource.standard === 'object' && 'grade' in resource.standard ? resource.standard.grade : resource.standard,
      subject: resource.subject && typeof resource.subject === 'object' && 'name' in resource.subject ? resource.subject.name : resource.subject,
      fileUrl: resource.fileUrl,
      videoUrl: resource.videoUrl,
      thumbnailUrl: resource.thumbnailUrl,
      size: resource.size,
      duration: resource.duration,
      createdAt: resource.createdAt,
      boardId: typeof resource.board === 'object' ? resource.board._id.toString() : '',
      standardId: typeof resource.standard === 'object' ? resource.standard._id.toString() : '',
      subjectId: typeof resource.subject === 'object' ? resource.subject._id.toString() : ''
    }));

    return res.json({
      success: true,
      data: transformedResources
    });
  } catch (error) {
    console.error('Error in searchResources:', error);
    res.status(500).json({
      success: false,
      error: "Error searching resources"
    });
  }
};

export const getResourcesBySubject = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params;
    const userId = req.user?.id;

    // Log for debugging
    console.log('Fetching resources for subject:', subjectId);

    // Check for active subscription
    const subscription = await Subscription.findOne({
      $or: [
        { userId, subjectId, status: 'active' },
        { userId, type: 'STANDARD', standardId: subjectId, status: 'active' }
      ]
    });

    // Modified queries to use subject instead of subjectId
    const pdfResources = await Resource.find({ 
      subject: subjectId,  // Changed from subjectId to subject
      type: 'PDF'
    }).populate('subject').populate('board').populate('standard');
    
    const videoResources = await Resource.find({ 
      subject: subjectId,  // Changed from subjectId to subject
      type: 'VIDEO'
    }).populate('subject').populate('board').populate('standard');

    // Log for debugging
    console.log('Found PDF resources:', pdfResources.length);
    console.log('Found Video resources:', videoResources.length);

    // Rest of your code remains the same
    const processResources = (resources: any[]) => {
      return resources.map(resource => {
        const resourceObj = resource.toJSON();
        return {
          ...resourceObj,
          isLocked: !resourceObj.isFree && !subscription
        };
      });
    };

    const processedPdfResources = processResources(pdfResources);
    const processedVideoResources = processResources(videoResources);

    const lockedResources = [...processedPdfResources, ...processedVideoResources]
      .filter(r => r.isLocked).length;

    res.json({
      success: true,
      data: {
        pdfResources: processedPdfResources,
        videoResources: processedVideoResources,
        totalResources: pdfResources.length + videoResources.length,
        lockedResources,
        hasSubscription: !!subscription
      }
    });
  } catch (error) {
    console.error('Error in getResourcesBySubject:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resources',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const subscribeToSubject = async (req: Request, res: Response) => {
  try {
    const { userId, subjectId } = req.body;

    // Verify payment here (implement your payment logic)
    
    // Add subject to user's subscriptions
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    if (!user.subscriptions.includes(subjectId)) {
      user.subscriptions.push(subjectId);
      await user.save();
    }

    res.json({
      success: true,
      message: "Successfully subscribed to subject"
    });
  } catch (error) {
    console.error('Error in subscribeToSubject:', error);
    res.status(500).json({
      success: false,
      error: "Error subscribing to subject"
    });
  }
}; 