import * as fileRepo from "../repositories/fileRepo.js";
import * as fileShareRepo from "../repositories/fileShareRepo.js";
import { generateShareToken } from "../utils/shareToken.js";
import storageService from "../storage/storageService.js";

const calculateExpiresAt = (duration) => {
    const now = Date.now();
    switch (duration) {
        case "1h":
            return new Date(now + 60 * 60 * 1000);
        case "1d":
            return new Date(now + 24 * 60 * 60 * 1000);
        case "1w":
            return new Date(now + 7 * 24 * 60 * 60 * 1000);
        case "never":
        default:
            return null;
    }
};

export const createFileShare = async (fileId, uid, duration = "never") => {
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

    const expiresAt = calculateExpiresAt(duration);
    const existingShare = await fileShareRepo.findByFileAndUser(numericFileId, numericUid);

    const isCurrentlyActiveAndUnexpired = existingShare && existingShare.isActive && (!existingShare.expiresAt || new Date(existingShare.expiresAt) > new Date());

    let tokenToUse;
    if (isCurrentlyActiveAndUnexpired) {
        // Active link: preserve token
        tokenToUse = existingShare.token;
    } else {
        // Expired or revoked or new link: generate NEW token
        tokenToUse = generateShareToken();
    }

    const fileShare = await fileShareRepo.upsertShare(
        numericFileId,
        numericUid,
        {
            token: tokenToUse,
            expiresAt,
            isActive: true
        },
        {
            token: tokenToUse,
            expiresAt,
            isActive: true
        }
    );

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
    if (!fileShare || !fileShare.file || fileShare.file.deletedAt || !fileShare.isActive) {
        throw new Error("Invalid or expired share link.");
    }


    if (fileShare.expiresAt && new Date() > new Date(fileShare.expiresAt)) {
        throw new Error("Invalid or expired share link.");
    }

    let downloadUrl = null;
    try {
        downloadUrl = await storageService.getSignedUrl(fileShare.file.stoName, 3600);
    } catch (err) {
        console.error("Failed to generate signed URL for share:", err);
    }

    const ownerName = fileShare.User?.name || fileShare.file?.user?.name || "CloudBox User";

    return {
        file: {
            id: fileShare.file.id,
            orgName: fileShare.file.orgName,
            mimeType: fileShare.file.mimeType,
            size: fileShare.file.size,
            createdAt: fileShare.file.createdAt
        },
        ownerName,
        downloadUrl,
        sharedAt: fileShare.createdAt,
        expiresAt: fileShare.expiresAt,
        isActive: fileShare.isActive
    };
};

export const revokeFileShare = async (fileId, uid) => {
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
        throw new Error("You don't have permission to unshare this file.");
    }

    await fileShareRepo.setIsActive(numericFileId, numericUid, false);

    return {
        success: true,
        message: "File is now private."
    };
};

export const getShareStatus = async (fileId, uid) => {
    const numericFileId = Number(fileId);
    const numericUid = Number(uid);

    if (isNaN(numericFileId)) {
        throw new Error("File not found.");
    }

    const fileShare = await fileShareRepo.findByFileAndUser(numericFileId, numericUid);
    if (!fileShare || !fileShare.isActive) {
        return {
            isShared: false,
            isActive: false
        };
    }

    const isExpired = fileShare.expiresAt && new Date() > new Date(fileShare.expiresAt);
    if (isExpired) {
        return {
            isShared: false,
            isActive: false,
            isExpired: true
        };
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const shareUrl = `${frontendUrl}/share/${fileShare.token}`;

    return {
        isShared: true,
        isActive: true,
        token: fileShare.token,
        shareUrl,
        expiresAt: fileShare.expiresAt,
        createdAt: fileShare.createdAt
    };
};

