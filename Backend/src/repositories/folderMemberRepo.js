import { prisma } from "../config/db.js";

export const create = async (data) => {
    return await prisma.folderMember.create({
        data,
    });
};

export const findMember = async (folderId, userId) => {
    const normalizedFolderId = Number(folderId);
    const normalizedUserId = Number(userId);

    if (!Number.isInteger(normalizedFolderId) || !Number.isInteger(normalizedUserId)) {
        return null;
    }

    return await prisma.folderMember.findUnique({
        where: {
            folderId_userId: {
                folderId: normalizedFolderId,
                userId: normalizedUserId,
            },
        },
    });
};

export const getFolderMembers = async (folderId) => {
    return await prisma.folderMember.findMany({
        where: {
            folderId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
};