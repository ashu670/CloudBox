import { prisma } from "../config/db.js";
import { canAccessFolder as checkAccess, FolderAction } from "../services/permissionService.js";

// Re-export for compatibility
export const canAccessFolder = (folderId, uid, command = FolderAction.READ) => {
    return checkAccess(folderId, uid, command);
};

export const findByIdAndUser = async (id, uid) => {
    if (!id) return true;

    return await prisma.folder.findFirst({
        where: {
            id,
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

export const createSharedFolderTx = async (folderData, ownerUid) => {
    return await prisma.$transaction(async (tx) => {
        const folder = await tx.folder.create({
            data: folderData
        });

        await tx.folderMember.create({
            data: {
                folderId: folder.id,
                userId: ownerUid,
                role: "OWNER"
            }
        });

        return folder;
    });
};

export const findChildren = async (uid, pid) => {
    if (pid === null || pid === 0) {
        const ownedChildren = await prisma.folder.findMany({
            where: {
                pid: null,
                uid,
            },
        });

        const memberships = await prisma.folderMember.findMany({
            where: { userId: uid },
            include: { folder: true },
        });

        const sharedRootFolders = memberships
            .map((m) => m.folder)
            .filter((f) => f.pid === null && f.uid !== uid);

        const seen = new Set(ownedChildren.map((f) => f.id));
        const children = [...ownedChildren];
        for (const folder of sharedRootFolders) {
            if (!seen.has(folder.id)) {
                children.push(folder);
                seen.add(folder.id);
            }
        }

        return {
            id: null,
            name: "Root",
            children,
            files: [],
        };
    }

    const folder = await prisma.folder.findUnique({
        where: {
            id: pid,
        },
        include: {
            files: true,
            children: true,
        },
    });

    if (!folder) {
        return null;
    }

    const hasAccess = await checkAccess(pid, uid, FolderAction.READ);
    if (!hasAccess) {
        throw new Error("Folder access denied");
    }

    return folder;
};

export const subfolders = async (folderId) => {

    return await prisma.$queryRaw`
        WITH RECURSIVE FolderTree AS (
        SELECT id FROM "Folder" WHERE id = ${folderId}
        UNION ALL
        SELECT f.id FROM "Folder" f
        INNER JOIN FolderTree ft ON f.pid = ft.id
        )
        SELECT id FROM FolderTree;`;
};

export const deleteFolder = async (id) => {
    return await prisma.folder.delete({
        where: {
            id
        }
    });
};

export const findByInviteCode = async (inviteCode) => {
    return await prisma.folder.findUnique({
        where: {
            inviteCode
        }
    });
};

export const findById = async (id) => {
    return await prisma.folder.findUnique({
        where: {
            id
        }
    });
};

export const renameFolder = async (id, newName) => {
    return await prisma.folder.update({
        where: { id },
        data: { name: newName }
    });
};

export const touch = async (id) => {
    return await prisma.folder.update({
        where: { id },
        data: {
            updatedAt: new Date()
        }
    });
};

export const move = async (id, newPid) => {
    return await prisma.folder.update({
        where: { id },
        data: {
            pid: newPid
        }
    });
};

export const findFolderWithOwnerDetails = async (folderId) => {
    return await prisma.folder.findUnique({
        where: { id: folderId },
        include: {
            user: {
                select: { id: true, name: true, email: true }
            }
        }
    });
};

export const getFolderStats = async (folderId) => {
    const folderIds = [folderId];
    let index = 0;
    while (index < folderIds.length) {
        const currentId = folderIds[index];
        const subfolders = await prisma.folder.findMany({
            where: { pid: currentId },
            select: { id: true }
        });
        for (const sub of subfolders) {
            folderIds.push(sub.id);
        }
        index++;
    }

    const files = await prisma.file.findMany({
        where: {
            folderId: { in: folderIds }
        },
        select: {
            size: true
        }
    });

    const filesCount = files.length;
    const storageUsed = files.reduce((acc, file) => acc + file.size, 0);

    return { filesCount, storageUsed };
};

import * as activityRepo from "./activityRepo.js";
import { ActivityType, TargetType } from "../utils/activityValidation.js";

export const transferOwnershipTx = async (folderId, newOwnerUserId, actorUserId, actorName, newOwnerName) => {
    return await prisma.$transaction(async (tx) => {
        await tx.folder.update({
            where: { id: folderId },
            data: { uid: newOwnerUserId }
        });

        await tx.folderMember.update({
            where: { folderId_userId: { folderId, userId: actorUserId } },
            data: { role: "ADMIN" }
        });

        await tx.folderMember.update({
            where: { folderId_userId: { folderId, userId: newOwnerUserId } },
            data: { role: "OWNER" }
        });

        await activityRepo.create({
            folderId,
            userId: actorUserId,
            action: ActivityType.OWNER_TRANSFERRED,
            target: TargetType.MEMBER,
            targetId: newOwnerUserId,
            message: `${actorName} transferred folder ownership to ${newOwnerName}.`
        }, tx);
    });
};

export const updateInviteCodeTx = async (folderId, inviteCodeData, actorUserId, actorName, actionName) => {
    return await prisma.$transaction(async (tx) => {
        const folder = await tx.folder.update({
            where: { id: folderId },
            data: inviteCodeData
        });

        await activityRepo.create({
            folderId,
            userId: actorUserId,
            action: ActivityType.SHARE_FOLDER,
            target: TargetType.FOLDER,
            targetId: folderId,
            message: `${actorName} ${actionName.toLowerCase()} the folder invite code.`
        }, tx);

        return folder;
    });
};