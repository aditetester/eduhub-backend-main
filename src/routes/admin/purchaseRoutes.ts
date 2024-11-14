import express, { RequestHandler } from "express";
import * as PurchaseController from "../../controller/Admin/purchaseController";
import { Request, Response, NextFunction } from "express";
import Purchase from "../../models/Purchase";

const router = express.Router();

export const updatePurchaseStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { purchaseId } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'COMPLETED', 'FAILED'].includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
      return;
    }

    const purchase = await Purchase.findByIdAndUpdate(
      purchaseId,
      { paymentStatus: status },
      { new: true }
    ).populate('user', 'name email')
     .populate('subject', 'name image price')
     .populate('standard', 'grade price');

    if (!purchase) {
      res.status(404).json({
        success: false,
        message: "Purchase not found"
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: purchase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update purchase status",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create purchases
router.post("/purchases/subject", PurchaseController.createSubjectPurchase as RequestHandler);
router.post("/purchases/standard", PurchaseController.createStandardPurchase as RequestHandler);

// Get user purchases
router.get("/purchases/user/:userId", PurchaseController.getUserPurchases as unknown as RequestHandler);

// Verify access
router.get("/purchases/verify/:resourceId", PurchaseController.verifyAccess as RequestHandler);

// Check expiration
router.get("/purchases/expiration/:userId/:purchaseId", PurchaseController.checkSubjectOrStandardExpiration);
// Get all purchases with optional type filter
router.get("/purchases", PurchaseController.getPurchasesByType as unknown as RequestHandler);

router.put("/purchases/:purchaseId/status", updatePurchaseStatus as RequestHandler);




export default router;