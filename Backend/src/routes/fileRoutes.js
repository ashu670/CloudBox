import express from "express";
import upload from "../config/multerConfig.js";
import * as fileCon from "../controllers/fileController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authenticate);

router.get('/download/:id', fileCon.download);
router.post("/upload", upload.single("file"), fileCon.uploadFile);
router.delete("/delete/:id", fileCon.del);
router.patch("/rename/:id", fileCon.rename);
router.patch("/move/:id/:pid", fileCon.move);

export default router;