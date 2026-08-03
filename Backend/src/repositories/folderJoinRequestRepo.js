import { prisma } from "../config/db.js";
import * as activityRepo from "./activityRepo.js";
import { ActivityType, TargetType } from "../validations/activityValidation.js";

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

export const approveJoinRequestTx = async (requestId, folderId, requestedByUserId, role = "VIEWER", actorUserId, actorName, targetName) => {
    return await prisma.$transaction(async (tx) => {
        await tx.folderJoinRequest.update({
            where: { id: requestId },
            data: { status: "APPROVED" },
        });
        
        await tx.folderMember.create({
            data: {
                folderId,
                userId: requestedByUserId,
                role,
            },
        });

        if (actorUserId && actorName && targetName) {
            await activityRepo.create({
                folderId,
                userId: actorUserId,
                action: ActivityType.APPROVE_REQUEST,
                target: TargetType.MEMBER,
                targetId: requestedByUserId,
                message: `${actorName} approved join request of ${targetName}.`
            }, tx);
        }
    });
};

export const rejectJoinRequestTx = async (requestId, folderId, actorUserId, actorName, targetName) => {
    return await prisma.$transaction(async (tx) => {
        const request = await tx.folderJoinRequest.update({
            where: { id: requestId },
            data: { status: "REJECTED" },
        });

        if (actorUserId && actorName && targetName) {
            await activityRepo.create({
                folderId,
                userId: actorUserId,
                action: ActivityType.REJECT_REQUEST,
                target: TargetType.MEMBER,
                targetId: request.requestedBy,
                message: `${actorName} rejected join request of ${targetName}.`
            }, tx);
        }
    });
};