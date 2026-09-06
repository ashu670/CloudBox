import bucket from "../config/firebase.js";

const storageService = {

    async getSignedUploadUrl(storageName, mimeType) {
        try {
            const file = bucket.file(storageName);

            const [uploadUrl] = await file.getSignedUrl({
                version: "v4",
                action: "write",
                expires: Date.now() + 15 * 60 * 1000,
                contentType: mimeType
            });

            return uploadUrl;

        } catch (error) {
            console.error("Firebase signed upload URL error:", error.message);
            throw error;
        }
    },

    async getMetadata(storageName) {
        try {
            const file = bucket.file(storageName);
            const [metadata] = await file.getMetadata();
            return metadata;
            
        } catch (error) {
            console.error("Firebase metadata error:", error.message);
            throw error;
        }
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

    async getSignedUrl(storageName, expiresMinutes = 60, promptSaveAs = null) {
        try {
            const file = bucket.file(storageName);

            const options = {
                action: "read",
                expires: Date.now() + expiresMinutes * 60 * 1000
            };

            if (promptSaveAs) {
                options.promptSaveAs = promptSaveAs;
            }

            const [url] = await file.getSignedUrl(options);

            return url;

        } catch (error) {
            console.error("Firebase signed read URL error:", error.message);
            throw error;
        }
    }

};

export default storageService;