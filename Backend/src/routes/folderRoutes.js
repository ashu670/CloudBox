import { Router } from "express";
import * as folderCon from "../controllers/folderController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.post('/', authenticate, folderCon.create);

export default router;