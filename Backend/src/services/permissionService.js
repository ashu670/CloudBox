import * as folderRepo from "../repositories/folderRepo.js";
import * as memberRepo from "../repositories/folderMemberRepo.js";

export const FolderAction = {
    READ: "r",
    WRITE: "w",
    CREATE: "c",
    RENAME: "d",
    MOVE: "m",
    DELETE: "x",
    SHARE: "s",
    MANAGE_PERMISSIONS: "p",
    OWNER_ADMIN: "a"
};

export const RolePermissions = {
    OWNER: new Set(["r", "w", "c", "d", "m", "x", "s", "p", "a"]),
    ADMIN: new Set(["r", "w", "c", "d", "m", "x", "s", "p"]),
    EDITOR: new Set(["r", "w", "c", "d", "m"]),
    VIEWER: new Set(["r"])
};

export const canAccessFolder = async (folderId, userId, action = FolderAction.READ) => {
    if (!folderId) return true;
    const normalizedFolderId = Number(folderId);
    if (isNaN(normalizedFolderId)) return false;

    const folder = await folderRepo.findById(normalizedFolderId);
    if (!folder) return false;

    if (folder.uid === userId) return true;

    let currentId = normalizedFolderId;
    while (currentId) {
        const member = await memberRepo.findMember(currentId, userId);
        if (member && RolePermissions[member.role]?.has(action)) {
            return true;
        }

        const currentFolder = await folderRepo.findById(currentId);
        if (!currentFolder?.pid) break;
        currentId = currentFolder.pid;
    }

    return false;
};

export const validateFolderAccess = async (folderId, userId, action = FolderAction.READ) => {
    if (!folderId) return true;
    const normalizedFolderId = Number(folderId);
    if (isNaN(normalizedFolderId)) return null;

    const folder = await folderRepo.findById(normalizedFolderId);
    if (!folder) return null;

    const hasAccess = await canAccessFolder(normalizedFolderId, userId, action);
    return hasAccess ? folder : null;
};
