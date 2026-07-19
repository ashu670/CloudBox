// src/routes/fileRoutes.js

import express from "express";
import upload from "../files/multerConfig.js";
import * as fileController from "../controllers/fileController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Upload a file
router.post(
    "/upload",
    authenticate,
    upload.single("file"),
    fileController.uploadFile
);

router.get(
    "/folder/:folderId",
    authenticate,
    fileController.getFilesByFolder
);

export default router;