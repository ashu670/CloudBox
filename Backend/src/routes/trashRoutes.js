import express from "express";
import * as trashCon from "../controllers/trashController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", trashCon.getTrashList);
router.post("/restore/all", trashCon.restoreAllItems);
router.post("/restore/:id", trashCon.restoreItem);

export default router;
