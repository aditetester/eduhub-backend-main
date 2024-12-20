import { Request, Response } from "express";
import Resource from "../../models/Resource";
import Subject from "../../models/Subject";
import fs from 'fs';
import path from 'path';

export const getResources = async (req: Request, res: Response) => {
  try {
    const { boardId, standardId, subjectId } = req.query;
    
    let query: any = {};
    if (boardId) query.board = boardId;
    if (standardId) query.standard = standardId;
    if (subjectId) query.subject = subjectId;

    const resources = await Resource.find(query)
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
    console.error('Error in getResources:', error);
    res.status(500).json({ 
      success: false, 
      error: "Error fetching resources" 
    });
  }
};

interface CreateResourceBody {
  subject_id: string;
  board: string;
  standard: string;
  type: 'PDF' | 'VIDEO';
  name: string;
  description?: string;
  videoUrl?: string;
  duration?: string;
}

export const createResource = async (
  req: Request<{}, {}, CreateResourceBody>,
  res: Response
) => {
  try {
    // Validate required fields
    const requiredFields = ['subject_id', 'board', 'standard', 'type', 'name'];
    for (const field of requiredFields as (keyof CreateResourceBody)[]) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    // Basic resource data
    const resourceData: any = {
      subject: req.body.subject_id,
      board: req.body.board,
      standard: req.body.standard,
      type: req.body.type.toUpperCase(),
      name: req.body.name,
      description: req.body.description || ''
    };

    // Handle type-specific fields
    if (resourceData.type === 'VIDEO') {
      if (!req.body.videoUrl) {
        return res.status(400).json({
          success: false,
          error: 'Video URL is required for video resources'
        });
      }
      if (!req.body.duration) {
        return res.status(400).json({
          success: false,
          error: 'Duration is required for video resources'
        });
      }
      resourceData.videoUrl = req.body.videoUrl;
      resourceData.duration = req.body.duration;
    } else if (resourceData.type === 'PDF') {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (!files.file?.[0]) {
        return res.status(400).json({
          success: false,
          error: 'PDF file is required'
        });
      }
      resourceData.fileUrl = files.file?.[0]
        ? `/uploads/resources/${files.file[0].filename}`
        : null;
      resourceData.size = `${(files.file[0].size / (1024 * 1024)).toFixed(2)} MB`;
    }

    // Handle thumbnail
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files.image?.[0]) {
      return res.status(400).json({
        success: false,
        error: 'Image is required'
      });
    }
    resourceData.thumbnailUrl = files.image?.[0]
      ? `/uploads/images/${files.image[0].filename}`
      : null;

    console.log('Creating resource with data:', resourceData);
    const resource = await Resource.create(resourceData);

    return res.status(201).json({
      success: true,
      data: resource
    });

  } catch (error) {
    console.error('Resource creation error:', error);
    // Clean up uploaded files
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        if (Array.isArray(fileArray)) {
          fileArray.forEach(file => {
            if (file.path && fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Resource creation failed'
    });
  }
};

interface UpdateResourceBody {
  name?: string;
  description?: string;
  type?: 'PDF' | 'VIDEO';
  board?: string;
  standard?: string;
  videoUrl?: string;
  duration?: string;
}

interface UpdateResourceRequest extends Request {
  files?: {
    file?: Express.Multer.File[];
    thumbnail?: Express.Multer.File[];
  };
}

export const updateResource = async (
  req: UpdateResourceRequest & { params: { id: string }, body: UpdateResourceBody },
  res: Response
) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      type, 
      board, 
      standard,
      videoUrl,
      duration 
    } = req.body;

    const resource = await Resource.findById(id);
    if (!resource) {
      if (req.files) {
        Object.values(req.files).forEach(file => {
          fs.unlinkSync(file[0].path);
        });
      }
      return res.status(404).json({ 
        success: false, 
        message: "Resource not found" 
      });
    }

    const updates: any = { 
      name, 
      description, 
      board, 
      standard 
    };

    if (type) {
      updates.type = type.toUpperCase();
    }

    // Handle file uploads
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (files.file) {
        // Delete old file if exists
        if (resource.fileUrl) {
          const oldPath = path.join(__dirname, '../../public', resource.fileUrl);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        updates.fileUrl = `uploads/resources/${files.file[0].filename}`;
        updates.size = `${(files.file[0].size / (1024 * 1024)).toFixed(2)} MB`;
        updates.url = updates.fileUrl;
      }
      
      if (files.thumbnail) {
        // Delete old thumbnail if exists
        if (resource.thumbnailUrl) {
          const oldPath = path.join(__dirname, '../../public', resource.thumbnailUrl);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        updates.thumbnailUrl = `/uploads/images/${files.thumbnail[0].filename}`;
      }
    }

    if (videoUrl) {
      updates.videoUrl = videoUrl;
      updates.url = videoUrl;
      if (duration) {
        updates.duration = duration;
      } else if (type === 'VIDEO') {
        return res.status(400).json({
          success: false,
          error: 'Duration is required for video resources'
        });
      }
    }

    const updatedResource = await Resource.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    res.json({ success: true, data: updatedResource });
  } catch (error) {
    if (req.files) {
      Object.values(req.files).forEach(file => {
        fs.unlinkSync(file[0].path);
      });
    }
    res.status(500).json({ 
      success: false, 
      message: "Error updating resource", 
      error 
    });
  }
};

export const deleteResource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: "Resource not found" 
      });
    }

    // Delete associated files
    if (resource.fileUrl) {
      const filePath = path.join(__dirname, '../../public', resource.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (resource.thumbnailUrl) {
      const thumbnailPath = path.join(__dirname, '../../public', resource.thumbnailUrl);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }

    await Resource.findByIdAndDelete(id);
    res.json({ success: true, message: "Resource deleted successfully" });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error deleting resource", 
      error 
    });
  }
};

export const getResourceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const resource = await Resource.findById(id)
      .populate('board', 'name')
      .populate('standard', 'grade')
      .populate('subject', 'name')
      .lean();

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: "Resource not found"
      });
    }

    // Clean up file paths to ensure consistency
    const cleanFilePath = (path: string | undefined) => {
      if (!path) return undefined;
      return path.startsWith('/') ? path.substring(1) : path;
    };

    const transformedResource = {
      _id: resource._id.toString(),
      name: resource.name,
      description: resource.description,
      type: resource.type,
      board: resource.board && typeof resource.board === 'object' && 'name' in resource.board ? resource.board.name : resource.board,
      standard: resource.standard && typeof resource.standard === 'object' && 'grade' in resource.standard ? resource.standard.grade : resource.standard,
      subject: resource.subject && typeof resource.subject === 'object' && 'name' in resource.subject ? resource.subject.name : resource.subject,
      fileUrl: resource.fileUrl 
        ? `${process.env.BACKEND_URL}${resource.fileUrl}`
        : null,
      videoUrl: resource.videoUrl,
      thumbnailUrl: resource.thumbnailUrl 
        ? `${process.env.BACKEND_URL}${resource.thumbnailUrl}`
        : null,
      size: resource.size,
      duration: resource.duration,
      createdAt: resource.createdAt,
      boardId: typeof resource.board === 'object' ? resource.board._id.toString() : '',
      standardId: typeof resource.standard === 'object' ? resource.standard._id.toString() : '',
      subjectId: typeof resource.subject === 'object' ? resource.subject._id.toString() : ''
    };

    return res.json({
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
