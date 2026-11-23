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
import * as storageRepo from "../repositories/storageRepo.js";

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

export const uploadFile = async (file, folderId, uid, hash) => {
    folderId = Number(folderId);

    if (isNaN(folderId)) {
        throw new Error("Invalid Folder ID.");
    }

    if (folderId !== -1) {
        const folderExists = await folderRepo.findById(folderId);
        if (!folderExists) {
            throw new Error("Folder not found.");
        }

        const hasWritePermission = await canAccessFolder(folderId, uid, FolderAction.WRITE);
        if (!hasWritePermission) {
            throw new Error("You don't have permission to upload files.");
        }
    }

    if (hash) {
        const checkExistingHash = await storageRepo.findByHash(hash, uid);
        if (checkExistingHash) {
            return { checkExistingHash, message: "Already exists" };
        }
    }

    const filesize = BigInt(file.size);
    const { usedSize, limit } = await getAvailableStorageDet(uid);
    const avlSize = limit - usedSize;

    if (filesize > avlSize) {
        throw new Error("Not enough storage available");
    }

    const stoName = await generateUniqueStorageName(uid, folderId, file.name);
    const signedUrl = await storageService.getSignedUploadUrl(stoName, file.mimeType);

    return { signedUrl, stoName };
};

export const uploadComplete = async (stoName, uid, hash, providedOrgName = null, providedFolderId = null) => {
    const parsedUid = Number(stoName.split("_")[0]);
    if (Number(uid) !== parsedUid) throw new Error("Access denied");

    const response = await storageService.getMetadata(stoName);
    if (!response) throw new Error("unable to fetch metadata");

    const match = stoName.match(/^(\d+)_(\d+)_(?:(\d+)_)?(.+)$/);
    const parsedFolderId = match ? Number(match[2]) : Number(stoName.split("_")[1]);
    const fallbackOrgName = match && match[4] ? match[4] : stoName;

    const folderId = providedFolderId !== null && providedFolderId !== undefined
        ? Number(providedFolderId)
        : parsedFolderId;
    const orgName = providedOrgName ? String(providedOrgName).trim() : fallbackOrgName;

    const existingStorageObject = await storageRepo.findByHash(hash, Number(uid));
    if (existingStorageObject) {
        throw new Error("Physical storage object already exists for this content hash. Use duplicate linking flow.");
    }

    const data = {
        stoName,
        mimeType: response.contentType || "application/octet-stream",
        ownerId: Number(uid),
        size: Number(response.size),
        hash
    };

    try {
        const storageObject = await storageRepo.create(data);
        const file = await fileRepo.create({
            orgName,
            folderId: Number(folderId),
            uid: Number(uid),
            storageObjectId: storageObject.id
        });

        await Promise.all([
            incrementStorageSize(uid, BigInt(data.size)),
            touchFolder(Number(folderId)),
            activityService.log({
                folderId: Number(folderId),
                userId: Number(uid),
                action: ActivityType.UPLOAD_FILE,
                target: TargetType.FILE,
                targetId: file.id,
                message: `Uploaded file "${orgName}"`
            })
        ]);

        return {
            ...file,
            size: storageObject.size,
            mimeType: storageObject.mimeType,
            storageObject
        };
    } catch (err) {
        await storageService.delete(stoName);
        console.error("Upload complete error:", err.message);
        throw err;
    }
};

export const createDuplicateFile = async (storageObjectId, hash, orgName, folderId, uid) => {
    const numericFolderId = Number(folderId);
    const numericUid = Number(uid);
    const numericStorageObjectId = Number(storageObjectId);

    if (isNaN(numericFolderId) || isNaN(numericUid) || isNaN(numericStorageObjectId)) {
        throw new Error("Invalid parameters provided for duplicate file creation.");
    }

    if (numericFolderId === -1 || numericFolderId === 0) {
        throw new Error("Files cannot be placed in the Root directory. Please select a valid folder.");
    }

    // 1. Verify destination folder existence and write access
    const targetFolder = await folderRepo.findById(numericFolderId);
    if (!targetFolder || targetFolder.deletedAt) {
        throw new Error("Destination folder not found.");
    }

    const hasWritePermission = await canAccessFolder(numericFolderId, numericUid, FolderAction.WRITE);
    if (!hasWritePermission) {
        throw new Error("You don't have permission to add files to this folder.");
    }

    // 2. Verify StorageObject existence, ownership, and content hash
    const storageObject = await storageRepo.findById(numericStorageObjectId);
    if (!storageObject) {
        throw new Error("Physical storage object not found.");
    }

    if (storageObject.ownerId !== numericUid) {
        throw new Error("Access denied: You do not own this physical storage object.");
    }

    if (hash && storageObject.hash !== hash) {
        throw new Error("Integrity check failed: Provided hash does not match storage object.");
    }

    // 3. Resolve clean logical file name
    const cleanOrgName = (orgName && String(orgName).trim())
        ? String(orgName).trim()
        : (storageObject.stoName.split("_").slice(3).join("_") || "Untitled File");

    // 4. Create logical File record referencing existing StorageObject
    // NOTICE: We do NOT create another StorageObject, we do NOT touch Firebase, and we do NOT increment used storage.
    const file = await fileRepo.create({
        orgName: cleanOrgName,
        folderId: numericFolderId,
        uid: numericUid,
        storageObjectId: storageObject.id
    });

    // 5. Touch destination folder and log activity
    await Promise.all([
        touchFolder(numericFolderId),
        activityService.log({
            folderId: numericFolderId,
            userId: numericUid,
            action: ActivityType.UPLOAD_FILE,
            target: TargetType.FILE,
            targetId: file.id,
            message: `Created file reference "${cleanOrgName}" via deduplication`
        })
    ]);

    return {
        ...file,
        size: storageObject.size,
        mimeType: storageObject.mimeType,
        storageObject
    };
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
    const updatedFile = await fileRepo.update(id, trimmedName);

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

    const stoName = file.storageObject?.stoName;
    if (!stoName) throw new Error("Physical storage object missing");

    const downloadUrl = await storageService.getSignedUrl(stoName, 60, file.orgName);

    return {
        downloadUrl,
        orgName: file.orgName,
        mimeType: file.storageObject?.mimeType || "application/octet-stream",
        size: file.storageObject?.size || 0
    };
};

export const preview = async (id, uid) => {
    const file = await fileRepo.findById(id);
    if (!file) throw new Error("File doesnt exists or access denied");

    const hasAccess = await canAccessFolder(file.folderId, uid, FolderAction.READ);
    if (!hasAccess) throw new Error("you dont have permission to view the file");
    
    const stoName = file.storageObject?.stoName;
    if (!stoName) throw new Error("Physical storage object missing");

    const previewUrl = await storageService.getSignedUrl(stoName, 15);

    return {
        url: previewUrl,
        orgName: file.orgName,
        mimeType: file.storageObject?.mimeType || "application/octet-stream",
        size: file.storageObject?.size || 0
    };
};

export const getStorageBreakdown = async (uid) => {
    const files = await fileRepo.findAllByUserId(uid);
    const stats = { image: 0, video: 0, audio: 0, document: 0 };

    files.forEach(file => {
        const mime = file.storageObject?.mimeType || "";
        const size = file.storageObject?.size || 0;
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
