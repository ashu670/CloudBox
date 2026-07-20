import { prisma } from "../config/db.js";

export const create = async (data) => {
    return await prisma.folderMember.create({
        data,
    });
};

export const findMember = async (folderId, userId) => {
    return await prisma.folderMember.findFirst({
        where: {
            folderId,
            userId,
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