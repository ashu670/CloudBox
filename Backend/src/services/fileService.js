import fs from "fs/promises";
import path from "path";
import * as fileRepo from "../repositories/fileRepo.js";
import * as folderRepo from "../repositories/folderRepo.js";
import storageService from "../storage/storageService.js";

const UPLOAD_BASE_DIR = path.resolve("uploads");

/**
 * Generates an operating-system style filename if duplicate names exist.
 * Format: uid_folderId_name_index.ext or uid_folderId_name.ext
 */
async function generateUniqueStorageName(uid, folderId, originalName) {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const prefix = `${uid}_${folderId}_${baseName}`;

    let counter = 0;
    let stoName = `${prefix}${ext}`;
    let targetPath = path.join(UPLOAD_BASE_DIR, stoName);

    // Loop until a non-conflicting filename is found on disk
    while (true) {
        try {
            await fs.access(targetPath);
            // File exists, increment suffix index configuration
            counter++;
            stoName = `${prefix}_${counter}${ext}`;
            targetPath = path.join(UPLOAD_BASE_DIR, stoName);
        } catch {
            // File does not exist, name is safe to use
            break;
        }
    }

    return stoName;
}

export const uploadFile = async (file, folderId, uid) => {
    folderId = Number(folderId);   // form-data se folderId string mein aata hai that's Using Number

    if (isNaN(folderId)) {       //if folder id is not detect
        throw new Error("Invalid Folder ID.");
    }

    // folder validation
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

        return await fileRepo.create(data);   // Saving in Database
    } catch (error) {
        // 4. Rollback: delete the uploaded file from disk if DB insertion fails
        await storageService.delete(stoName);
        throw error;
    }
};

// Fetching
export const getFilesByFolder = async (folderId, uid) => {
    folderId = Number(folderId);     // folderId ko number mein convert karo

    if (isNaN(folderId)) {
        throw new Error("Invalid Folder ID.");
    }
    const validFolder = await folderRepo.findByIdAndUser(
        folderId,
        uid
    );
    if (!validFolder) {
        throw new Error(
            "Folder not found or access denied."
        );
    }
    const files = await fileRepo.findAllByFolderId(
        folderId                 // files fetch kar rhe 
    );

    return files;
};