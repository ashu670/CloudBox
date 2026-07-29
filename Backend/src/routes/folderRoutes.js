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
router.post("/invite/regenerate", checkFolderRole("OWNER"), folderCon.regenerateInviteCode);
router.post("/invite/disable", checkFolderRole("OWNER"), folderCon.disableInviteCode);
router.post("/invite/enable", checkFolderRole("OWNER"), folderCon.enableInviteCode);
router.post("/invite/expire", checkFolderRole("OWNER"), folderCon.expireInviteCode);

// GET Routes
router.get("/fetch/:id", folderCon.fetch);
router.get("/requests/:folderId", folderCon.getFolderRequests);
router.get("/members/:folderId", checkFolderRole(["OWNER", "ADMIN"]), folderCon.getFolderMembers);
router.get("/owner-panel/:folderId", checkFolderRole("OWNER"), folderCon.getOwnerPanel);
router.get("/admin-panel/:folderId", checkFolderRole(["OWNER", "ADMIN"]), folderCon.getAdminPanel);
router.get("/activities/:folderId", checkFolderRole(["OWNER", "ADMIN"]), folderCon.getFolderActivities);

// PATCH Routes
router.patch("/request/approve", folderCon.approveRequest);
router.patch("/request/reject", folderCon.rejectRequest);
router.patch('/rename/:id', folderCon.rename);
router.patch('/move/:id/:pid', folderCon.move);
router.patch("/members/role", checkFolderRole("OWNER"), folderCon.updateMemberRole);
router.patch("/transfer-ownership", checkFolderRole("OWNER"), folderCon.transferOwnership);

// DELETE Routes
router.delete("/delete/:id", folderCon.deleteFolder);
router.delete("/members/:folderId/:userId", checkFolderRole(["OWNER", "ADMIN"]), folderCon.removeFolderMember);

export default router;