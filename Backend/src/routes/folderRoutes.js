import { Router } from "express";
import * as folderCon from "../controllers/folderController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { checkFolderRole } from "../middleware/checkFolderRole.js";

const router = Router();

router.use(authenticate);

// POST Routes
router.post("/create", folderCon.create);
router.post("/create-shared", folderCon.createSharedFolder);
router.post("/join", folderCon.joinSharedFolder);

// GET Routes
router.get("/fetch/:id", folderCon.fetch);
router.get("/requests/:folderId", folderCon.getFolderRequests);

router.get("/members/:folderId",checkFolderRole("OWNER"),folderCon.getFolderMembers);

// PATCH Routes
router.patch("/request/approve",checkFolderRole("OWNER"),folderCon.approveRequest);
router.patch("/request/reject",checkFolderRole("OWNER"),folderCon.rejectRequest);
router.patch('/rename/:id', folderCon.rename);
router.patch('/move/:id/:pid', folderCon.move);

// DELETE Routes
router.delete("/delete/:id", folderCon.deleteFolder);

export default router;