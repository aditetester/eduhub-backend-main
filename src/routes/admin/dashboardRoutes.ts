import express from "express";
import * as DashboardController from "../../controller/Admin/dashboardController";


const router = express.Router();

// Apply authentication and admin authorization to all dashboard routes


// Dashboard routes
router.get("/stats", DashboardController.getDashboardStats);
router.get("/board-stats", DashboardController.getBoardwiseStats);
router.get("/popular-resources", DashboardController.getPopularResources);
router.get("/recent-purchases", DashboardController.getRecentPurchases);
router.get("/subject-revenue", DashboardController.getSubjectRevenue);

export default router;