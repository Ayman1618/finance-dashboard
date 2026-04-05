import { Router } from "express";
import { RecordController } from "../controllers/record.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { CreateRecordSchema, UpdateRecordSchema, RecordFilterSchema } from "@finance/shared";

const router = Router();

// All record routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Financial records management
 */

/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: List records with filters and pagination
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of records
 */
router.get("/", validate(RecordFilterSchema, "query"), RecordController.listRecords);

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Create a financial record (Analyst, Admin)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *                 enum: [SALARY, FREELANCE, FOOD, RENT, TRANSPORT, OTHER]
 *               date:
 *                 type: string
 *                 example: "2024-06-01"
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Record created
 *       403:
 *         description: Insufficient permissions
 */
router.post("/", authorize("ANALYST", "ADMIN"), validate(CreateRecordSchema), RecordController.createRecord);

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Get a single record by ID
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", RecordController.getRecordById);

/**
 * @swagger
 * /api/records/{id}:
 *   patch:
 *     summary: Update a record (Analyst, Admin)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 */
router.patch("/:id", authorize("ANALYST", "ADMIN"), validate(UpdateRecordSchema), RecordController.updateRecord);

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     summary: Soft delete a record (Admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", authorize("ADMIN"), RecordController.deleteRecord);

export default router;
