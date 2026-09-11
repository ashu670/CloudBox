import { prisma } from "../config/db.js";

export const create = async (data, tx = prisma) => {
    return await tx.trashLogs.create({ data });
};

export const findExpired = async (now = new Date()) => {
    return await prisma.trashLogs.findMany({
        where: {
            expiry: {
                lte: now
            }
        }
    });
};

export const deleteById = async (id, tx = prisma) => {
    return await tx.trashLogs.delete({
        where: {
            id
        }
    });
};

export const findByUserId = async (uid) => {
    return await prisma.trashLogs.findMany({
        where: {
            uid,
            expiry: {
                gt: new Date()
            }
        },
        include: {
            file: true,
            folder: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};

export const findByIdAndUid = async (id, uid) => {
    return await prisma.trashLogs.findFirst({
        where: {
            id: Number(id),
            uid: Number(uid)
        },
        include: {
            file: true,
            folder: true
        }
    });
};
