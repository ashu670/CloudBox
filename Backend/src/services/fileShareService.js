import * as fileRepo from "../repositories/fileRepo.js";
import * as fileShareRepo from "../repositories/fileShareRepo.js";
import { generateShareToken } from "../utils/shareToken.js";
import storageService from "../storage/storageService.js";

export const createFileShare = async (fileId, uid) => {
    const numericFileId = Number(fileId);
    const numericUid = Number(uid);

    if (isNaN(numericFileId)) {
        throw new Error("File not found.");
    }

    const file = await fileRepo.findById(numericFileId);
    if (!file) {
        throw new Error("File not found.");
    }

    if (file.uid !== numericUid) {
        throw new Error("You don't have permission to share this file.");
    }

    let fileShare = await fileShareRepo.findByFileAndUser(numericFileId, numericUid);

    if (!fileShare) {
        const token = generateShareToken();
        fileShare = await fileShareRepo.create({
            token,
            fileId: numericFileId,
            uid: numericUid
        });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const shareUrl = `${frontendUrl}/share/${fileShare.token}`;

    return {
        ...fileShare,
        shareUrl
    };
};

export const getFileShareByToken = async (token) => {
    if (!token || typeof token !== "string" || !token.trim()) {
        throw new Error("Invalid or expired share link.");
    }

    const fileShare = await fileShareRepo.findByToken(token.trim());
    if (!fileShare || !fileShare.file) {
        throw new Error("Invalid or expired share link.");
    }

    let downloadUrl = null;
    try {
        downloadUrl = await storageService.getSignedUrl(fileShare.file.stoName, 60);
    } catch (err) {
        console.error("Failed to generate signed download URL for share:", err);
    }

    return {
        file: {
            id: fileShare.file.id,
            orgName: fileShare.file.orgName,
            mimeType: fileShare.file.mimeType,
            size: fileShare.file.size,
            createdAt: fileShare.file.createdAt
        },
        downloadUrl,
        sharedAt: fileShare.createdAt
    };
};
