import express from "express";
import * as ResourceController from "../../controller/Admin/resourceController";
import { resourceUpload, handleUploadError } from "../../middleware/fileUpload";
import { validateResourceInput } from '../../middleware/validateResource';
import { Request, Response, NextFunction } from "express";
import { cleanupOnError } from '../../middleware/fileCleanup';

const router = express.Router();

// Get all resources (with optional subject_id as query parameter)
router.get("/resources", ResourceController.getResources as express.RequestHandler);

// Create new resource
router.post('/:subject_id',
  (req: Request, res: Response, next: NextFunction) => {
    console.log('Request received:', {
      method: req.method,
      url: req.url,
      baseUrl: req.baseUrl,
      params: req.params
    });
    next();
    return;
  },
  resourceUpload as express.RequestHandler,
  handleUploadError as express.ErrorRequestHandler,
 
  cleanupOnError as express.ErrorRequestHandler,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ResourceController.createResource(req, res);
    } catch (error) {
      next(error);
    }
  }
);
router.get('/resources/:id', ResourceController.getResourceById as express.RequestHandler);

// Register error handler for this route
router.use("/:subject_id", 
  handleUploadError as express.ErrorRequestHandler
);

// Update resource
router.put("/:id", 
  resourceUpload as express.RequestHandler,
  handleUploadError as express.ErrorRequestHandler,
  async (req: Request & { files?: { file?: Express.Multer.File[], thumbnail?: Express.Multer.File[] }, params: { id: string } }, res: Response, next: NextFunction) => {
    try {
      await ResourceController.updateResource(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Delete resource
router.delete("/:id", 
  ResourceController.deleteResource as express.RequestHandler
);

export default router;