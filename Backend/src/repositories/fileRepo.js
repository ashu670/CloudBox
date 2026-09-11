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
            folderId: Number(folderId),
            deletedAt: null
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const findByUserId = async (id, uid) => {
    return await prisma.file.findFirst({
        where: {
            id,
            uid: uid,
            deletedAt: null
        }
    });
};

export const findById = async (id) => {
    return await prisma.file.findFirst({
        where: {
            id,
            deletedAt: null
        },
    });
};

export const findActiveById = async (id) => {
    return await findById(id);
};

export const findDeletedById = async (id) => {
    return await prisma.file.findFirst({
        where: {
            id,
            deletedAt: {
                not: null
            }
        }
    });
};

export const findAnyById = async (id) => {
    return await prisma.file.findUnique({
        where: { id }
    });
};

export const delById = async (id, tx = prisma) => {
    return await tx.file.delete({
        where: { id }
    });
};

export const softDelete = async (id, tx = prisma) => {
    return tx.file.update({
        where: {
            id
        },
        data: {
            deletedAt: new Date()
        }
    });
};

export const update = async (id, stoName, orgName) => {
    const data = { orgName: orgName, stoName: stoName };
    return await prisma.file.update({
        where: { id },
        data: data
    });
};

export const move = async (id, newPid) => {
    const data = { folderId: newPid };

    return await prisma.file.update({
        where: { id },
        data: data
    });
};

export const fetchByFolderIdAndUserId = async (folderId, userId) => {
    return await prisma.$queryRaw`
        WITH RECURSIVE FolderTree AS (
        -- Root folder owned by the user
        SELECT id FROM "Folder"
        WHERE id = ${folderId} AND uid = ${userId} AND "deletedAt" IS NULL

        UNION ALL

        -- Subfolders owned by the user
        SELECT f.id FROM "Folder" f
        INNER JOIN FolderTree ft ON f.pid = ft.id
        WHERE f.uid = ${userId} AND f."deletedAt" IS NULL
        )
        -- Files owned by the user across the entire tree
        SELECT * FROM "File"
        WHERE "folderId" IN (SELECT id FROM FolderTree)
        AND uid = ${userId}
        AND "deletedAt" IS NULL;
    `;
};

export const findAllByUserId = async (userId) => {
    return await prisma.file.findMany({
        where: {
            uid: Number(userId),
            deletedAt: null
        },
        select: {
            mimeType: true,
            size: true
        }
    });
};

