// src/storage/storageService.js
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_BASE_DIR = './uploads';

/**
 * Ensures the destination storage folder exists on the host machine.
 */
async function ensureDirectoryExists(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }
}

/**
 * Generates an operating-system style filename if duplicate names exist.
 * Format: uid_folderId_name_index.ext or uid_folderId_name.ext
 */
async function generateUniqueStorageName(uid, folderId, originalName) {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    
    // Clean prefix using context properties
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

    return { stoName, targetPath };
}

/**
 * Phase 5: Primary Action - Store binary memory buffer straight onto local storage disk.
 */
export const storageService = {
    async store(file, uid, folderId) {
        if (!file || !file.buffer) {
            throw new Error('Invalid file object: Missing memory buffer data chunks');
        }

        await ensureDirectoryExists(UPLOAD_BASE_DIR);

        // Determine unique storage signature
        const { stoName, targetPath } = await generateUniqueStorageName(uid, folderId, file.originalname);

        // Write the decoupled raw memory buffer straight to the disk hardware allocation
        await fs.writeFile(targetPath, file.buffer);

        return {
            stoName
        };
    }
};