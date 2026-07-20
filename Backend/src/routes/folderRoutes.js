import { Router } from "express";
import * as folderCon from "../controllers/folderController.js";
import { authenticate } from "../middleware/authMiddleware.js";


const router = Router();

router.use(authenticate);

router.post('/create', folderCon.create);
router.get('/fetch/:id', folderCon.fetch);
router.delete('/delete/:id', folderCon.deleteFolder);
router.patch('/rename/:id', folderCon.rename);

export default router;