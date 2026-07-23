import { prisma } from "../config/db.js";

export const create = async (data) => {
    return await prisma.folderJoinRequest.create({
        data
    });
};

export const findRequest = async (folderId, requestedBy) => {
    const normalizedFolderId = Number(folderId);
    const normalizedRequestedBy = Number(requestedBy);

    if (!Number.isInteger(normalizedFolderId) || !Number.isInteger(normalizedRequestedBy)) {
        return null;
    }

    return await prisma.folderJoinRequest.findUnique({
        where: {
            folderId_requestedBy: {
                folderId: normalizedFolderId,
                requestedBy: normalizedRequestedBy,
            },
        },
    });
};

export const findPendingRequest = async (folderId, requestedBy) => {
    const normalizedFolderId = Number(folderId);
    const normalizedRequestedBy = Number(requestedBy);

    if (!Number.isInteger(normalizedFolderId) || !Number.isInteger(normalizedRequestedBy)) {
        return null;
    }

    return await prisma.folderJoinRequest.findFirst({
        where: {
            folderId: normalizedFolderId,
            requestedBy: normalizedRequestedBy,
            status: "PENDING",
        },
    });
};

export const findByFolderId = async (folderId, status) => {
    const where = { folderId };
    if (status) {
        where.status = status;
    }

    return await prisma.folderJoinRequest.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: { requestedAt: "desc" },
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