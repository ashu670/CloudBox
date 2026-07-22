import { prisma } from "../config/db.js";

export const create = async (data) => {
    return await prisma.folderJoinRequest.create({
        data
    });
};

export const findRequest = async (
    folderId,
    requestedBy
) => {
    return await prisma.folderJoinRequest.findFirst({
        where: {
            folderId,
            requestedBy
        }
    });
};

export const findByFolderId = async (folderId) => {
    return await prisma.folderJoinRequest.findMany({
        where: {
            folderId
        }
    });
};

export const findById = async (id) => {
    return await prisma.folderJoinRequest.findUnique({
        where: {
            id
        }
    });
};


export const updateStatus = async (id, status) => {
    return await prisma.folderJoinRequest.update({
        where: {
            id
        },
        data: {
            status
        }
    });

};