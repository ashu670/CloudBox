import { Router } from "express";
import * as folderCon from "../controllers/folderController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.post('/create', authenticate, folderCon.create);
router.get('/fetch/:id', authenticate, folderCon.fetch);

export default router;