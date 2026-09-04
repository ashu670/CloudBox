import { prisma } from "../config/db.js";

export const create = async (data) => {
    return await prisma.fileShare.create({
        data
    });
};

export const findByToken = async (token) => {
    return await prisma.fileShare.findUnique({
        where: { token },
        include: {
            file: {
                include: {
                    user: {
                        select: { id: true, name: true, email: true }
                    }
                }
            },
            User: {
                select: { id: true, name: true, email: true }
            }
        }
    });
};

export const findByFileAndUser = async (fileId, uid) => {
    return await prisma.fileShare.findUnique({
        where: {
            fileId_uid: {
                fileId: Number(fileId),
                uid: Number(uid)
            }
        },
        include: {
            file: {
                include: {
                    user: {
                        select: { id: true, name: true, email: true }
                    }
                }
            },
            User: {
                select: { id: true, name: true, email: true }
            }
        }
    });
};

export const upsertShare = async (fileId, uid, updateData, createData) => {
    const numFileId = Number(fileId);
    const numUid = Number(uid);
    return await prisma.fileShare.upsert({
        where: {
            fileId_uid: {
                fileId: numFileId,
                uid: numUid
            }
        },
        update: updateData,
        create: {
            ...createData,
            fileId: numFileId,
            uid: numUid
        }
    });
};

export const setIsActive = async (fileId, uid, isActive) => {
    return await prisma.fileShare.updateMany({
        where: {
            fileId: Number(fileId),
            uid: Number(uid)
        },
        data: {
            isActive: Boolean(isActive)
        }
    });
};

export const deleteByFileAndUser = async (fileId, uid) => {
    return await prisma.fileShare.deleteMany({
        where: {
            fileId: Number(fileId),
            uid: Number(uid)
        }
    });
};