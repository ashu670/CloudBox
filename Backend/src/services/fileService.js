import fs from "fs/promises";
import path from "path";
import * as fileRepo from "../repositories/fileRepo.js";
import * as folderRepo from "../repositories/folderRepo.js";
import { touchFolder } from "./folderService.js";
import storageService from "../storage/storageService.js";

const UPLOAD_BASE_DIR = path.resolve("uploads");

async function generateUniqueStorageName(uid, folderId, originalName) {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const prefix = `${uid}_${folderId}_${baseName}`;

    let counter = 0;
    let stoName = `${prefix}${ext}`;
    let targetPath = path.join(UPLOAD_BASE_DIR, stoName);

    while (true) {
        try {
            await fs.access(targetPath);
            counter++;
            stoName = `${prefix}_${counter}${ext}`;
            targetPath = path.join(UPLOAD_BASE_DIR, stoName);
        } catch {
            break;
        }
    }

    return stoName;
}

export const uploadFile = async (file, folderId, uid) => {
    folderId = Number(folderId);

    if (isNaN(folderId)) {
        throw new Error("Invalid Folder ID.");
    }

    const validFolder = await folderRepo.findByIdAndUser(folderId, uid);

    if (!validFolder) {
        throw new Error("Folder not found or access denied.");
    }

    // 1. Generate filename
    const stoName = await generateUniqueStorageName(uid, folderId, file.originalname);

    // 2. Store file
    await storageService.store(file, stoName);

    try {
        // 3. Insert metadata to DB
        const data = {
            orgName: file.originalname,
            stoName: stoName,
            mimeType: file.mimetype,
            size: file.size,
            folderId: folderId,
            uid: uid
        };

        touchFolder(folderId);

        return await fileRepo.create(data);   // Saving in Database
    } catch (error) {
        // 4. Rollback: delete the uploaded file from disk if DB insertion fails
        await storageService.delete(stoName);
        throw error;
    }
};

export const del = async (id, uid) => {
    const valid = await fileRepo.findByUserId(id, uid);
    if(!valid) throw new Error("File not exists or access denied");
    touchFolder(valid.folderId);
    await storageService.delete(valid.stoName);

    return await fileRepo.delById(id);
}

export const renameFile = async (id, uid, newOrgName) => {
    if (!newOrgName || !newOrgName.trim()) {
        throw new Error("New file name is required.");
    }

    // 1. Fetch current database record securely using await
    const currentFile = await fileRepo.findByUserId(id, uid);
    if (!currentFile) {
        throw new Error("File does not exist or access denied.");
    }

    const oldStoName = currentFile.stoName;

    // 2. Generate a fresh, non-conflicting unique disk filename string
    const newStoName = await generateUniqueStorageName(
        currentFile.uid,
        currentFile.folderId,
        newOrgName
    );

    // 3. Make sure the storage parameters align exactly with the service method signature
    // Passing (oldName, newName) to match standard fs conventions
    await storageService.rename(oldStoName, newStoName);

    try {
        // 4. Update the database record parameters using your repository update method
        touchFolder(currentFile.folderId);
        return await fileRepo.update(id, newStoName, newOrgName);
    } catch (error) {
        // 5. Rollback on disk if the Postgres transaction query fails
        await storageService.rename(newStoName, oldStoName);
        throw error;
    }
};