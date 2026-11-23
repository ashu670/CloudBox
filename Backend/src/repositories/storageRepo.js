import { prisma } from "../config/db.js";

export const create = async (data) => {
    return await prisma.storageObject.create({
        data
    });
};

export const findById = async (id) => {
    return await prisma.storageObject.findUnique({
        where: { id: Number(id) }
    });
};

export const findByStoName = async (stoName) => {
    return await prisma.storageObject.findUnique({
        where: { stoName }
    });
};

export const findByHash = async (hash, ownerId) => {
    return await prisma.storageObject.findUnique({
        where: {
            ownerId_hash: {
                ownerId,
                hash
            }
        }
    });
};

export const countReferences = async (storageObjectId) => {
    return await prisma.file.count({
        where: {
            storageObjectId: Number(storageObjectId)
        }
    });
};

export const deleteById = async (id) => {
    return await prisma.storageObject.delete({
        where: { id: Number(id) }
    });
};

export const findAllByOwnerId = async (ownerId) => {
    return await prisma.storageObject.findMany({
        where: {
            ownerId: Number(ownerId)
        },
        select: {
            mimeType: true,
            size: true
        }
    });
};