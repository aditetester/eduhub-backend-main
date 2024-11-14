import express, { RequestHandler } from "express";
import * as StandardController from "../../controller/Admin/standardController";
import { upload } from "../../middleware/fileUpload";
import { validateImage } from '../../middleware/imageValidation';

const router = express.Router();

// Basic CRUD routes
router.get("/boards/:board_id/standards", StandardController.getStandards as RequestHandler);
router.post("/boards/:board_id/standards", upload.single('image'), validateImage as RequestHandler, StandardController.createStandard as RequestHandler);
router.patch("/standards/:id", upload.single('image'), validateImage as RequestHandler, StandardController.updateStandard as RequestHandler);
router.delete("/standards/:id", StandardController.deleteStandard as RequestHandler);

// Additional routes for detailed information
router.get("/standards/:id/details", StandardController.getStandardWithSubjects as RequestHandler);
router.get("/standards/:id/total-price", StandardController.getStandardTotalPrice as RequestHandler);

export default router;
