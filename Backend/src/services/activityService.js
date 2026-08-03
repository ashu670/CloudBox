import * as activityRepo from "../repositories/activityRepo.js";
import { validateActivityLogInput } from "../validations/activityValidation.js";
import { canAccessFolder, FolderAction } from "./permissionService.js";

=
export const log = async ({ folderId, userId, action, target, targetId, message }, tx = null) => {
    try {
        if (!folderId || folderId <= 0) return null;

        validateActivityLogInput({ folderId, userId, action, target });

        return await activityRepo.create(
            {folderId, userId, action, target, targetId, message,},
            tx
        );
    } catch (error) {
        console.error("ActivityService.log error:", error.message);
        if (tx) throw error;
        return null;
    }
};

export const getFolderActivities = async (folderId, userId) => {
    const numericFolderId = Number(folderId);
    const numericUserId = Number(userId);

    if (!Number.isInteger(numericFolderId) || numericFolderId <= 0) {
        throw new Error("Invalid Folder ID.");
    }

    if (!Number.isInteger(numericUserId)) {
        throw new Error("Invalid User ID.");
    }

    const hasAccess = await canAccessFolder(numericFolderId, numericUserId, FolderAction.READ);
    if (!hasAccess) {
        throw new Error("Unauthorized: Access denied to folder activity logs.");
    }

    const activities = await activityRepo.findByFolderId(numericFolderId);

    return activities.map((a) => ({
        id: a.id,
        folderId: a.folderId,
        userId: a.userId,
        userName: a.user?.name || "Unknown",
        userEmail: a.user?.email || "",
        action: a.action,
        target: a.target,
        targetId: a.targetId,
        message: a.message,
        createdAt: a.createdAt,
    }));
};
