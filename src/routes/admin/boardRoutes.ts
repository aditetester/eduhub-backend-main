import express, { Request, Response, NextFunction, RequestHandler } from "express";
import * as BoardController from "../../controller/Admin/boardController";
import { upload } from "../../middleware/fileUpload";
import { validateImage } from '../../middleware/imageValidation';

const router = express.Router();

router.get("/boards", BoardController.getBoards as RequestHandler);

router.post("/boards", 
  upload.single('image') as RequestHandler,
  validateImage as RequestHandler,
  BoardController.createBoard as RequestHandler
);

router.delete("/boards/:id", BoardController.deleteBoard as RequestHandler);

router.patch("/boards/:id", 
  upload.single('image') as RequestHandler,
  validateImage as RequestHandler,
  BoardController.updateBoard as RequestHandler
);

export default router;
