import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// Create upload directories if they don't exist
const dirs = ['uploads/images', 'uploads/resources'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'image') {
      cb(null, 'uploads/images/');
    } else if (file.fieldname === 'file') {
      cb(null, 'uploads/resources/');
    } else {
      cb(new Error(`Invalid fieldname: ${file.fieldname}`), '');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('Filtering file:', {
    fieldname: file.fieldname,
    mimetype: file.mimetype,
    originalname: file.originalname
  });

  if (file.fieldname === 'image') {
    if (file.mimetype.startsWith('image/')) {
      console.log('Valid image');
      cb(null, true);
    } else {
      console.log('Invalid image type:', file.mimetype);
      cb(new Error('Invalid image! Please upload an image file (JPG, PNG, etc.).'));
    }
  } else if (file.fieldname === 'file') {
    if (file.mimetype === 'application/pdf') {
      console.log('Valid PDF file');
      cb(null, true);
    } else {
      console.log('Invalid PDF type:', file.mimetype);
      cb(new Error('Invalid file! Please upload a PDF file.'));
    }
  } else {
    console.log('Invalid fieldname:', file.fieldname);
    cb(new Error('Invalid field name!'));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Helper functions
export const resourceUpload = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

export const imageUpload = upload.single('image');

// Error handler middleware
export const handleUploadError = (
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large! Maximum size allowed is 50MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};