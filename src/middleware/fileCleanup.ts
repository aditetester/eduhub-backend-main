import { Request, Response, NextFunction } from 'express';
import fs from 'fs';

export const cleanupOnError = (err: any, req: Request, res: Response, next: NextFunction) => {
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
  next(err);
}; 