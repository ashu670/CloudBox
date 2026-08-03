import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getActivities } from "../controllers/activityController.js";

const router = Router();
router.get("/:folderId", authenticate, getActivities);

export default router;
