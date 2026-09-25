import path from "path";
import { prisma } from "../config/db.js";
import * as fileRepo from "../repositories/fileRepo.js";
import * as folderRepo from "../repositories/folderRepo.js";
import { getAvailableStorageDet, updateStorageSize, incrementStorageSize } from "../repositories/userRepo.js";
import { touchFolder, getFolderWorkspaceBoundary } from "./folderService.js";
import { canAccessFolder, validateFolderAccess, FolderAction } from "./permissionService.js";
import storageService from "../storage/storageService.js";
import * as activityService from "./activityService.js";
import { ActivityType, TargetType } from "../utils/activityValidation.js";
import * as trashLogs from "./trashService.js";

async function generateUniqueStorageName(uid, folderId, originalName) {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const timestamp = Date.now();
    const prefix = `${uid}_${folderId}_${timestamp}_${baseName}`;

    let counter = 0;
    let stoName = `${prefix}${ext}`;

    while (await storageService.exists(stoName)) {
        counter++;
        stoName = `${prefix}_${counter}${ext}`;
    }

    return stoName;
}

export const uploadFile = async (file, folderId, uid) => {
    folderId = Number(folderId);

    if (isNaN(folderId)) {
        throw new Error("Invalid Folder ID.");
    }

    if(folderId !== -1){
        const folderExists = await folderRepo.findById(folderId);
        if (!folderExists) {
            throw new Error("Folder not found.");
        }

        const hasWritePermission = await canAccessFolder(folderId, uid, FolderAction.WRITE);
        if (!hasWritePermission) {
            throw new Error("You don't have permission to upload files.");
        }
    }

    const filesize = BigInt(file.size);
    const {usedSize, limit} = await getAvailableStorageDet(uid);
    const avlSize = limit - usedSize;

    if(filesize > avlSize){
        throw new Error("Not enough storage available");
    }

    const stoName = await generateUniqueStorageName(uid, folderId, file.name);
    const signedUrl = await storageService.getSignedUploadUrl(stoName, file.mimeType);

    return {signedUrl, stoName};
};

export const uploadComplete = async (stoName, uid) => {
    if (uid !== Number(stoName.split("_")[0])) throw new Error("Access denied");
    const response = await storageService.getMetadata(stoName);
    if (!response) throw new Error("unable to fetch metadata");
    
    const data = {
        orgName: stoName.split("_").slice(3).join("_"),
        stoName,
        mimeType: response.contentType,
        folderId: Number(stoName.split("_")[1]),
        uid,
        size: Number(response.size)
    };

    try {
        const file = await fileRepo.create(data);

        await Promise.all([
            incrementStorageSize(uid, BigInt(data.size)),
            touchFolder(data.folderId),
            activityService.log({
                folderId: data.folderId,
                userId: uid,
                action: ActivityType.UPLOAD_FILE,
                target: TargetType.FILE,
                targetId: file.id,
                message: `Uploaded file "${data.orgName}"`
            })
        ]);

        return file;
    } catch (err) {
        await storageService.delete(stoName);
        console.error("Upload complete error:", err.message);
        throw err;
    }
};

export const del = async (id, uid) => {

    const valid = await fileRepo.findByUserId(id, uid);

    if (!valid) {
        throw new Error("File not exists or access denied");
    }

    touchFolder(valid.folderId);

    // Create trash record & soft-delete
    const data = {
        uid,
        fileId: id,
        folderId: null,
        type: "FILE",
        pid: valid.folderId
    };

    const trashRecord = await trashLogs.create(data);
    const deleted = await fileRepo.softDelete(id);

    await activityService.log({
        folderId: valid.folderId,
        userId: uid,
        action: ActivityType.DELETE_FILE,
        target: TargetType.FILE,
        targetId: id,
        message: `Deleted file "${valid.orgName}"`
    });

    return {
        expiry: trashRecord.expiry,
        ...deleted
    };
};



export const renameFile = async (id, uid, newOrgName) => {
    if (!newOrgName || !newOrgName.trim()) {
        throw new Error("New file name is required.");
    }

    const currentFile = await fileRepo.findByUserId(id, uid);
    if (!currentFile) {
        throw new Error("File does not exist or access denied.");
    }

    const trimmedName = newOrgName.trim();
    touchFolder(currentFile.folderId);
    const updatedFile = await fileRepo.update(id, currentFile.stoName, trimmedName);

    await activityService.log({
        folderId: currentFile.folderId,
        userId: uid,
        action: ActivityType.RENAME_FILE,
        target: TargetType.FILE,
        targetId: id,
        message: `Renamed file to "${trimmedName}"`
    });

    return updatedFile;
};

export const move = async (id, uid, newPid) => {
    if (newPid === -1 || newPid === 0 || newPid === "0" || newPid === "-1") {
        newPid = null;
    } else if (newPid !== null && newPid !== undefined) {
        newPid = Number(newPid);
    }

    const fileId = Number(id);
    const userId = Number(uid);

    // 1. Fetch file
    const file = await fileRepo.findById(fileId);
    if (!file || file.deletedAt) {
        throw new Error("File does not exist or has been deleted.");
    }

    // 2. Permission validation on source folder
    const canMoveSource = await canAccessFolder(file.folderId, userId, FolderAction.MOVE);
    if (!canMoveSource) {
        throw new Error("Unauthorized: You do not have permission to move this file.");
    }

    // 3. Resolve and validate destination folder
    if (newPid !== null) {
        const destinationFolder = await folderRepo.findById(newPid);
        if (!destinationFolder || destinationFolder.deletedAt) {
            throw new Error("Destination folder does not exist or has been deleted.");
        }

        const canWriteDestination = await canAccessFolder(newPid, userId, FolderAction.CREATE);
        if (!canWriteDestination) {
            throw new Error("Unauthorized: You do not have permission to move items into the destination folder.");
        }
    }

    // 4. Workspace Boundary Validation
    const sourceBoundary = await getFolderWorkspaceBoundary(file.folderId, userId);
    const destinationBoundary = await getFolderWorkspaceBoundary(newPid, userId);

    if (!sourceBoundary || !destinationBoundary) {
        throw new Error("Invalid workspace boundary.");
    }

    if (sourceBoundary.type !== destinationBoundary.type) {
        throw new Error("Cross-workspace moves are forbidden: items cannot move between Private Drive and Projects.");
    }

    if (sourceBoundary.type === "PROJECT") {
        if (sourceBoundary.rootId !== destinationBoundary.rootId) {
            throw new Error("Cross-project moves are forbidden: items cannot move between different projects.");
        }
        if (newPid === null) {
            newPid = sourceBoundary.rootId;
        }
    } else if (sourceBoundary.type === "PRIVATE_DRIVE") {
        if (sourceBoundary.userId !== destinationBoundary.userId || sourceBoundary.userId !== userId) {
            throw new Error("Cannot move items across different user accounts.");
        }
        if (newPid === null) {
            const userRoot = await folderRepo.findRootFolder(userId);
            newPid = userRoot ? userRoot.id : null;
        }
    }

    // 5. Already in this folder
    if (file.folderId === newPid) {
        return file;
    }

    if (file.folderId) touchFolder(file.folderId);
    if (newPid) touchFolder(newPid);

    const movedFile = await fileRepo.move(fileId, newPid);

    if (newPid) {
        await activityService.log({
            folderId: newPid,
            userId,
            action: ActivityType.MOVE_FILE,
            target: TargetType.FILE,
            targetId: fileId,
            message: `Moved file "${file.orgName || file.name}" into this folder`
        });
    }

    return movedFile;
};

export const download = async (id, uid) => {
    const file = await fileRepo.findById(id);
    if (!file) throw new Error("File doesnt exist or access denied");

    const hasAccess = await canAccessFolder(file.folderId, uid, FolderAction.READ);
    if (!hasAccess) throw new Error("File doesnt exist or access denied");


    const downloadUrl = await storageService.getSignedUrl(file.stoName, 60, file.orgName);

    return {
        downloadUrl,
        orgName: file.orgName,
        mimeType: file.mimeType,
        size: file.size
    };
};

export const preview = async (id, uid) => {
    const file = await fileRepo.findById(id);
    if(!file) throw new Error("File doesnt exists or access denied");

    const hasAccess = await canAccessFolder(file.folderId, uid, FolderAction.READ);
    if(!hasAccess) throw new Error("you dont have permission to view the file");
    
    const previewUrl = await storageService.getSignedUrl(file.stoName, 15);

    return {
        url : previewUrl,
        orgName : file.orgName,
        mimeType : file.mimeType,
        size : file.size
    };
}

export const getStorageBreakdown = async (uid) => {
    const files = await fileRepo.findAllByUserId(uid);
    const stats = { image: 0, video: 0, audio: 0, document: 0 };

    files.forEach(file => {
        const mime = file.mimeType || "";
        const size = file.size || 0;
        if (mime.startsWith("image/")) stats.image += size;
        else if (mime.startsWith("video/")) stats.video += size;
        else if (mime.startsWith("audio/")) stats.audio += size;
        else stats.document += size;
    });

    const { usedSize, limit } = await getAvailableStorageDet(uid);
    const usedStorageNumber = Number(usedSize);
    const storageLimitNumber = Number(limit);

    return {
        stats,
        usedStorage: usedStorageNumber,
        storageLimit: storageLimitNumber
    };
};