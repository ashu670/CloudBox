import { Router } from "express";
import * as folderCon from "../controllers/folderController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.post('/create', authenticate, folderCon.create);
router.get('/fetch/:id', authenticate, folderCon.fetch);
router.delete('/delete/:id', authenticate, folderCon.deleteFolder);

export default router;