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
    if (pid === null || pid === 0) {
        const children = await prisma.folder.findMany({
            where: {
                pid: null,
                uid
            }
        });
        return {
            id: null,
            name: "Root",
            children,
            files: []
        };
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: pid
        },
        include: {
            files: true,
            children: true
        }
    });

    if (!folder) {
        return null;
    }

    if (folder.uid !== uid) {
        throw new Error("Folder access denied");
    }

    return folder;
};

export const deleteFolder = async (id) => {
    return await prisma.folder.delete({
        where: {
            id
        }
    });
};

export const renameFolder = async (id, newName) => {
    const data = {name : newName};
    return await prisma.folder.update({
        where : {id},
        data : data
    });
}

export const touch = async (id) => {
    return await prisma.folder.update({
        where : {id},
        data : {
            updatedAt : new Date()
        }
    });
};

export const move = async (id, newPid) => {
    return await prisma.folder.update({
        where : {id},
        data : {
            pid : newPid
        }
    });
};