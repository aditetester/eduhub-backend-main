import express, { RequestHandler, Request, Response } from "express";
import * as SubjectController from "../../controller/Admin/subjectController";
import { upload } from "../../middleware/fileUpload";
import { validateImage } from '../../middleware/imageValidation';

const router = express.Router();

// Get all subjects for a standard
router.get(
  "/standards/:standard_id/subjects",
  SubjectController.getSubjects as unknown as RequestHandler
);

// Create a new subject with image upload
router.post(
  "/standards/:standard_id/subjects",
  upload.single('image') as unknown as RequestHandler,
  validateImage as RequestHandler,
  SubjectController.createSubject as unknown as RequestHandler
);

// Delete a subject
router.delete(
  "/subjects/:id",
  SubjectController.deleteSubject as unknown as RequestHandler
);

// Update a subject with image upload
router.patch(
  "/subjects/:id",
  upload.single('image') as unknown as RequestHandler,
  validateImage as RequestHandler,
  SubjectController.updateSubject as unknown as RequestHandler
);

export default router;