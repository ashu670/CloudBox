import { prisma } from "../config/db.js";

export const findByIdAndUser = async (id, uid) => {
    if (!id) return true;

    return await prisma.folder.findFirst({
        where: {
            id,   // returning proper folder
            uid
        }
    });
};

export const findDuplicate = async (name, pid, uid) => {
    return await prisma.folder.findFirst({
        where: {
            name,
            pid,
            uid
        }
    });
};

export const create = async (data) => {
    return await prisma.folder.create({
        data
    });
};

export const findChildren = async (uid, pid) => {
    return await prisma.folder.findUnique({
        where: {
            id : pid,
            uid : uid
        },
        include : {
            files : true,
            children : true
        }
    });
};

export const deleteFolder = async (id) => {
    return await prisma.folder.delete({
        where: {
            id
        }
    });
};