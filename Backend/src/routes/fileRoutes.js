import express from "express";
import * as fileCon from "../controllers/fileController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authenticate);


router.get('/storage-breakdown', fileCon.getStorageBreakdown);
router.get('/download/:id', fileCon.download);
router.get("/share/:id", fileCon.getShareStatus);
router.get('/preview/:id', fileCon.preview);

router.post("/upload", fileCon.uploadFile);
router.post("/upload/complete", fileCon.uploadComplete);
router.post("/share/:id", fileCon.share);

router.delete("/share/:id", fileCon.unshare);
router.delete("/delete/:id", fileCon.del);

router.patch("/move/:id/:pid", fileCon.move);
router.patch("/rename/:id", fileCon.rename);

export default router;