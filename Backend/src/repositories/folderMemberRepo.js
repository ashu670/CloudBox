 import { prisma } from "../config/db.js";

export const create = async (data) => {
    return await prisma.folderMember.create({
        data
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

import * as activityRepo from "./activityRepo.js";
import { ActivityType, TargetType } from "../utils/activityValidation.js";

export const removeMemberTx = async (folderId, targetUserId, actorUserId, actorName, targetName) => {
    return await prisma.$transaction(async (tx) => {
        await tx.folderMember.delete({
            where: {
                folderId_userId: {
                    folderId,
                    userId: targetUserId
                }
            }
        });

        await activityRepo.create({
            folderId,
            userId: actorUserId,
            action: ActivityType.MEMBER_REMOVED,
            target: TargetType.MEMBER,
            targetId: targetUserId,
            message: `${actorName} removed member ${targetName} from the folder.`
        }, tx);
    });
};

export const updateRoleTx = async (folderId, targetUserId, newRole, actorUserId, actorName, targetName, oldRole) => {
    return await prisma.$transaction(async (tx) => {
        await tx.folderMember.update({
            where: {
                folderId_userId: {
                    folderId,
                    userId: targetUserId
                }
            },
            data: {
                role: newRole
            }
        });

        await activityRepo.create({
            folderId,
            userId: actorUserId,
            action: ActivityType.ROLE_CHANGED,
            target: TargetType.MEMBER,
            targetId: targetUserId,
            message: `${actorName} changed role of ${targetName} from ${oldRole} to ${newRole}.`
        }, tx);
    });
};