// src/storage/storageService.js
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_BASE_DIR = path.resolve("uploads");

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

const storageService = {
    async store(file, storageName) {
        if (!file || !file.buffer) {
            throw new Error('Invalid file object: Missing memory buffer data chunks');
        }

        await ensureDirectoryExists(UPLOAD_BASE_DIR);

        const targetPath = path.join(UPLOAD_BASE_DIR, storageName);

        // Write the decoupled raw memory buffer straight to the disk hardware allocation
        await fs.writeFile(targetPath, file.buffer);

        return {
            success: true,
            path: targetPath,
            stoName: storageName
        };
    },

    async delete(storageName) {
        const targetPath = path.join(UPLOAD_BASE_DIR, storageName);
        try {
            await fs.unlink(targetPath);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    },

    async rename(newName, oldName){
        const oldPath = path.join(UPLOAD_BASE_DIR, oldName);
        const newPath = path.join(UPLOAD_BASE_DIR, newName);
        try{
            await fs.rename(oldPath, newPath);
        }catch(err){
            console.log(err);
        }
    }
};

export default storageService;