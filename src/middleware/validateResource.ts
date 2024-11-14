import { Request, Response, NextFunction } from 'express';

export const validateResourceInput = (req: Request, res: Response, next: NextFunction) => {
  // Skip image validation for purchase routes
  if (req.path.includes('purchase')) {
    return next();
  }

  console.log('Validating resource input:', {
    body: req.body,
    files: req.files
  });

  const { type, videoUrl } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  // Image validation only for resource creation
  if (!files?.image) {
    return res.status(400).json({
      success: false,
      message: "Image is required"
    });
  }

  // Validate required fields
  if (!type) {
    return res.status(400).json({
      success: false,
      message: "Resource type is required"
    });
  }

  // Validate type-specific requirements
  if (type.toUpperCase() === 'PDF') {
    if (!files?.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required for PDF resources"
      });
    }
  } else if (type.toUpperCase() === 'VIDEO') {
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: "Video URL is required for video resources"
      });
    }
    if (!req.body.duration) {
      return res.status(400).json({
        success: false,
        message: "Duration is required for video resources"
      });
    }
    if (req.body.duration) {
      const durationRegex = /^\d{1,2}:\d{2}$/;  // Format: MM:SS
      if (!durationRegex.test(req.body.duration)) {
        return res.status(400).json({
          success: false,
          message: "Duration must be in MM:SS format (e.g., '05:30')"
        });
      }
    }
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid resource type. Must be either 'PDF' or 'VIDEO'"
    });
  }

  next();
};