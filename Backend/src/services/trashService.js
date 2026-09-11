import { prisma } from "../config/db.js";
import * as repo from '../repositories/trashRepo.js';
import { findAnyById } from '../repositories/folderRepo.js';
import * as fileRepo from '../repositories/fileRepo.js';
import * as folderRepo from '../repositories/folderRepo.js';
import * as userRepo from '../repositories/userRepo.js';
import storageService from '../storage/storageService.js';

const findLocation = async (pid, location = []) => {
    if (!pid || pid === 0) {
        if (!location.includes("Root")) {
            location.unshift("Root");
        }
        return location.join("/");
    }

    const folder = await findAnyById(pid);

    if (!folder) {
        if (!location.includes("Root")) {
            location.unshift("Root");
        }
        return location.join("/");
    }

    if (!folder.isRoot && folder.name !== "Root") {
        location.unshift(folder.name);
    } else {
        if (!location.includes("Root")) {
            location.unshift("Root");
        }
        return location.join("/");
    }

    if (!folder.pid) {
        if (!location.includes("Root")) {
            location.unshift("Root");
        }
        return location.join("/");
    }

    return findLocation(folder.pid, location);
};

export const create = async (data, tx) => {
    const { uid, type, pid } = data;

    const location = await findLocation(pid);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    return await repo.create({
        ...data,
        location: location || "Root",
        expiry: expiryDate
    }, tx);
};

async function cleanupExpiredFile(trashLog) {
    const fileId = trashLog.fileId;
    if (!fileId) {
        await repo.deleteById(trashLog.id);
        return 0;
    }

    const file = await fileRepo.findAnyById(fileId);
    if (!file) {
        console.warn(`TrashLog ${trashLog.id}: File record ${fileId} not found in DB. Cleaning orphaned log.`);
        await repo.deleteById(trashLog.id);
        return 0;
    }

    // 1. Delete physical object from storage
    if (file.stoName) {
        try {
            await storageService.delete(file.stoName);
        } catch (err) {
            console.warn(`TrashLog ${trashLog.id}: Storage deletion warning for ${file.stoName}: ${err.message}`);
        }
    }

    // 2. Permanently delete File DB record
    await fileRepo.delById(file.id);

    // 3. Subtract file.size from user's usedStorage
    await userRepo.decrementStorageSize(trashLog.uid, file.size);

    // 4. Delete TrashLog entry
    await repo.deleteById(trashLog.id);

    console.log(`Permanently deleted file: ${file.id} ("${file.orgName}")`);
    return file.size || 0;
}

async function cleanupExpiredFolder(trashLog) {
    const folderId = trashLog.folderId;
    if (!folderId) {
        await repo.deleteById(trashLog.id);
        return 0;
    }

    const folder = await folderRepo.findAnyById(folderId);
    if (!folder) {
        console.warn(`TrashLog ${trashLog.id}: Folder record ${folderId} not found in DB. Cleaning orphaned log.`);
        await repo.deleteById(trashLog.id);
        return 0;
    }

    const subfolderRows = await folderRepo.subfolders(folderId);
    const folderIds = subfolderRows.map(f => f.id);
    if (!folderIds.includes(folderId)) {
        folderIds.push(folderId);
    }

    const files = await prisma.file.findMany({
        where: {
            folderId: { in: folderIds }
        }
    });

    let totalStorageRemoved = 0;

    for (const file of files) {
        if (file.stoName) {
            try {
                await storageService.delete(file.stoName);
            } catch (err) {
                console.warn(`TrashLog ${trashLog.id}: Storage deletion warning for file ${file.id}: ${err.message}`);
            }
        }
        totalStorageRemoved += file.size || 0;
    }

    await prisma.file.deleteMany({
        where: {
            folderId: { in: folderIds }
        }
    });

    await prisma.folder.deleteMany({
        where: {
            id: { in: folderIds }
        }
    });

    if (totalStorageRemoved > 0) {
        await userRepo.decrementStorageSize(trashLog.uid, totalStorageRemoved);
    }

    await repo.deleteById(trashLog.id);

    console.log(`Permanently deleted folder: ${folder.id} ("${folder.name}")`);
    return totalStorageRemoved;
}

export const cleanupExpired = async () => {
    console.log("Trash cleanup started");
    const expiredLogs = await repo.findExpired();
    console.log(`Expired items found: ${expiredLogs.length}`);

    let totalReclaimed = 0;

    for (const trashLog of expiredLogs) {
        try {
            if (trashLog.type === "FILE") {
                const reclaimed = await cleanupExpiredFile(trashLog);
                totalReclaimed += reclaimed;
            } else if (trashLog.type === "FOLDER") {
                const reclaimed = await cleanupExpiredFolder(trashLog);
                totalReclaimed += reclaimed;
            } else {
                await repo.deleteById(trashLog.id);
            }
        } catch (err) {
            console.error(`Cleanup failure for TrashLog ${trashLog.id}: ${err.message}`);
        }
    }

    console.log(`Storage reclaimed: ${totalReclaimed} bytes`);
    console.log("Trash cleanup completed");
    return {
        processedCount: expiredLogs.length,
        totalReclaimed
    };
};

export const getUserTrash = async (uid) => {
    const logs = await repo.findByUserId(uid);
    const now = new Date();

    return logs.map(log => {
        const expiryDate = new Date(log.expiry);
        const diffMs = expiryDate - now;
        const secondsLeft = Math.max(0, Math.ceil(diffMs / 1000));
        const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        let name = "Unknown Item";
        let size = 0;
        let mimeType = null;

        if (log.type === "FILE" && log.file) {
            name = log.file.orgName;
            size = log.file.size;
            mimeType = log.file.mimeType;
        } else if (log.type === "FOLDER" && log.folder) {
            name = log.folder.name;
        }

        return {
            id: log.id,
            type: log.type,
            name,
            size,
            mimeType,
            location: log.location,
            expiry: log.expiry,
            secondsLeft,
            daysLeft,
            createdAt: log.createdAt,
            fileId: log.fileId,
            folderId: log.folderId,
            pid: log.pid
        };
    });
};

export const restoreTrashItem = async (id, uid) => {
    const trashLog = await repo.findByIdAndUid(id, uid);
    if (!trashLog) {
        throw new Error("Trash log entry not found or access denied");
    }

    const rootFolder = await folderRepo.findRootFolder(uid);
    const rootFolderId = rootFolder ? rootFolder.id : null;

    if (trashLog.type === "FILE") {
        if (!trashLog.fileId) {
            await repo.deleteById(trashLog.id);
            throw new Error("Target file no longer exists");
        }

        const file = await fileRepo.findAnyById(trashLog.fileId);
        if (!file) {
            await repo.deleteById(trashLog.id);
            throw new Error("File record missing");
        }

        let targetFolderId = trashLog.pid;
        if (targetFolderId && targetFolderId > 0) {
            const parentFolder = await folderRepo.findAnyById(targetFolderId);
            if (!parentFolder || parentFolder.deletedAt) {
                targetFolderId = rootFolderId;
            }
        } else {
            targetFolderId = rootFolderId;
        }

        await prisma.file.update({
            where: { id: file.id },
            data: {
                deletedAt: null,
                folderId: targetFolderId
            }
        });

        await repo.deleteById(trashLog.id);

        return {
            message: `Restored file "${file.orgName}"`,
            type: "FILE",
            id: file.id
        };
    } else if (trashLog.type === "FOLDER") {
        if (!trashLog.folderId) {
            await repo.deleteById(trashLog.id);
            throw new Error("Target folder no longer exists");
        }

        const folder = await folderRepo.findAnyById(trashLog.folderId);
        if (!folder) {
            await repo.deleteById(trashLog.id);
            throw new Error("Folder record missing");
        }

        let targetPid = trashLog.pid;
        if (targetPid && targetPid > 0) {
            const parentFolder = await folderRepo.findAnyById(targetPid);
            if (!parentFolder || parentFolder.deletedAt) {
                targetPid = rootFolderId;
            }
        } else {
            targetPid = rootFolderId;
        }

        const subfolderRows = await folderRepo.subfolders(folder.id);
        const folderIds = subfolderRows.map(f => f.id);
        if (!folderIds.includes(folder.id)) {
            folderIds.push(folder.id);
        }

        await prisma.folder.updateMany({
            where: { id: { in: folderIds } },
            data: { deletedAt: null }
        });

        if (targetPid !== folder.pid) {
            await prisma.folder.update({
                where: { id: folder.id },
                data: { pid: targetPid }
            });
        }

        await prisma.file.updateMany({
            where: { folderId: { in: folderIds } },
            data: { deletedAt: null }
        });

        await repo.deleteById(trashLog.id);

        return {
            message: `Restored folder "${folder.name}"`,
            type: "FOLDER",
            id: folder.id
        };
    }
};

export const restoreAllTrash = async (uid) => {
    const logs = await repo.findByUserId(uid);
    let restoredCount = 0;

    for (const log of logs) {
        try {
            await restoreTrashItem(log.id, uid);
            restoredCount++;
        } catch (err) {
            console.error(`Failed to restore trash item ${log.id}:`, err.message);
        }
    }

    return {
        message: `Restored ${restoredCount} items from trash`,
        restoredCount
    };
};