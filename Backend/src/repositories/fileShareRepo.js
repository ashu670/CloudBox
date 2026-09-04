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
            file: true
        }
    });
};

export const findByFileAndUser = async (fileId, uid) => {
    return await prisma.fileShare.findFirst({
        where: {
            fileId: Number(fileId),
            uid: Number(uid)
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