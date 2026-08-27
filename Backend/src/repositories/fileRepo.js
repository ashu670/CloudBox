import { prisma } from "../config/db.js";

export const create = async (data) => {
    return await prisma.file.create({
        data
    });
};

export const findByStoName = async (stoName) => {
    return await prisma.file.findFirst({
        where: {
            stoName
        }
    });
};

export const findAllByFolderId = async (folderId) => {
    return await prisma.file.findMany({
        where: {
            folderId: Number(folderId)
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const findByUserId = async (id, uid) => {
    return await prisma.file.findFirst({
        where : {
            id,
            uid : uid
        }
    });
};

export const findById = async (id) => {
    return await prisma.file.findUnique({
        where: { id },
    });
};

export const delById = async (id) => {
    return await prisma.file.delete({
        where : {id}
    });
};

export const update = async (id, stoName, orgName) => {
    const data = {orgName : orgName, stoName : stoName};
    return await prisma.file.update({
        where : {id},
        data : data
    });
};

export const move = async (id, newPid) => {
    const data = {folderId : newPid};

    return await prisma.file.update({
        where : {id},
        data : data
    });
};

export const fetchByFolderIdAndUserId = async (folderId, userId) => {
    return await prisma.$queryRaw`
        WITH RECURSIVE FolderTree AS (
        -- Root folder owned by the user
        SELECT id FROM "Folder"
        WHERE id = ${folderId} AND uid = ${userId}

        UNION ALL

        -- Subfolders owned by the user
        SELECT f.id FROM "Folder" f
        INNER JOIN FolderTree ft ON f.pid = ft.id
        WHERE f.uid = ${userId}
        )
        -- Files owned by the user across the entire tree
        SELECT * FROM "File"
        WHERE "folderId" IN (SELECT id FROM FolderTree)
        AND uid = ${userId};
    `;
};

export const findAllByUserId = async (userId) => {
    return await prisma.file.findMany({
        where: {
            uid: Number(userId)
        },
        select: {
            mimeType: true,
            size: true
        }
    });
};