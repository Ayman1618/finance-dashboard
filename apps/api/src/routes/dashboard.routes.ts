import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Analytics and summary endpoints
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get overall financial summary (all roles)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           example: "2024-01-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Summary data
 */
router.get("/summary", DashboardController.getSummary);

/**
 * @swagger
 * /api/dashboard/by-category:
 *   get:
 *     summary: Get category-wise income/expense breakdown (all roles)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get("/by-category", DashboardController.getCategoryBreakdown);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     summary: Get monthly income vs expense trends (all roles)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2024
 */
router.get("/trends", DashboardController.getMonthlyTrends);

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     summary: Get recent transactions (all roles)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get("/recent", DashboardController.getRecentTransactions);

/**
 * @swagger
 * /api/dashboard/insights:
 *   get:
 *     summary: Get deep financial insights (Analyst, Admin)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get("/insights", authorize("ANALYST", "ADMIN"), DashboardController.getInsights);

/**
 * @swagger
 * /api/dashboard/audit-logs:
 *   get:
 *     summary: Get audit logs (Admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get("/audit-logs", authorize("ADMIN"), DashboardController.getAuditLogs);

export default router;
