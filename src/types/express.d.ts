import { Request } from 'express';
import { File } from 'multer';

interface ResourceRequest extends Request {
  files?: {
    file?: File[];
    image?: File[];
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        [key: string]: any;
      };
      hasSubscription?: boolean;
      userSubscription?: {
        id: string;
        type: string;
        validUntil: Date;
        [key: string]: any;
      };
    }
  }
}

export {}; 