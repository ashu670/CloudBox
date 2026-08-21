import bucket from '../config/firebase.js';

const storageService = {
    async store(file, storageName) {
        if (!file || !file.buffer) {
            throw new Error('Invalid file object: Missing memory buffer data chunks');
        }

        const mimeType = file.mimetype || 'application/octet-stream';
        const blob = bucket.file(storageName);

        await blob.save(file.buffer, {
            metadata: {
                contentType: mimeType
            },
            resumable: false
        });

        return {
            success: true,
            stoName: storageName
        };
    },
    async uploadFile(file, storageName) {
        return this.store(file, storageName);
    },
    async exists(storageName) {
        try {
            const [fileExists] = await bucket.file(storageName).exists();
            return fileExists;
        } catch (error) {
            console.error("Firebase Storage exists check error:", error.message);
            return false;
        }
    },
    async delete(storageName) {
        try {
            await bucket.file(storageName).delete({ ignoreNotFound: true });
            return { success: true };
        } catch (error) {
            console.error("Firebase Storage delete error:", error.message);
            throw error;
        }
    },
    async deleteFile(storageName) {
        return this.delete(storageName);
    },
    async rename(oldName, newName) {
        try {
            const srcFile = bucket.file(oldName);
            const destFile = bucket.file(newName);

            await srcFile.copy(destFile);
            await srcFile.delete({ ignoreNotFound: true });

            return {
                success: true,
                stoName: newName
            };
        } catch (error) {
            console.error("Firebase Storage rename error:", error.message);
            throw error;
        }
    },
    async download(storageName) {
        try {
            const file = bucket.file(storageName);
            const [fileExists] = await file.exists();
            if (!fileExists) {
                throw new Error(`File "${storageName}" not found in Firebase Storage.`);
            }
            return file.createReadStream();
        } catch (error) {
            console.error("Firebase Storage download stream error:", error.message);
            throw error;
        }
    },
    async downloadFile(storageName) {
        return this.download(storageName);
    },

    async getFileStream(storageName) {
        return this.download(storageName);
    },
    async getSignedUrl(storageName, expiresMinutes = 60) {
        try {
            const file = bucket.file(storageName);
            const [url] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + expiresMinutes * 60 * 1000
            });
            return url;
        } catch (error) {
            console.error("Firebase Storage getSignedUrl error:", error.message);
            throw error;
        }
    },
    async getPresignedUrl(storageName, expiresMinutes = 60) {
        return this.getSignedUrl(storageName, expiresMinutes);
    }
};

export default storageService;