import { prisma } from "../config/db.js";
import { canAccessFolder as checkAccess, FolderAction } from "../services/permissionService.js";
import * as activityRepo from "./activityRepo.js";
import { ActivityType, TargetType } from "../utils/activityValidation.js";

// Re-export for compatibility
export const canAccessFolder = (folderId, uid, command = FolderAction.READ) => {
    return checkAccess(folderId, uid, command);
};

export const findByIdAndUser = async (id, uid) => {
    if (!id) return true;

    return await prisma.folder.findFirst({
        where: {
            id,
            uid,
            deletedAt: null
        }
    });
};

export const findDuplicate = async (name, pid, uid) => {
    return await prisma.folder.findFirst({
        where: {
            name,
            pid,
            uid,
            deletedAt: null
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

export const findRootFolder = async (uid) => {
    let rootFolder = await prisma.folder.findFirst({
        where: {
            uid,
            isRoot: true,
            deletedAt: null
        }
    });

    if (!rootFolder) {
        rootFolder = await prisma.folder.findFirst({
            where: {
                uid,
                pid: null,
                deletedAt: null
            }
        });
    }

    return rootFolder;
};

export const searchChild = async (uid, name) => {

    const [folders, files] = await Promise.all([
        prisma.folder.findMany({
            where: {
                uid,
                name: {
                    startsWith: name,
                    mode: "insensitive"
                },
                deletedAt: null
            }
        }),

        prisma.file.findMany({
            where: {
                uid,
                orgName: {
                    startsWith: name,
                    mode: "insensitive"
                },
                deletedAt: null
            }
        })
    ]);

    return {
        folders,
        files
    };
};

export const findChildren = async (uid, pid) => {
    let isRootContext = false;
    if (pid === null || pid === 0 || pid === -1) {
        const rootFolder = await findRootFolder(uid);

        if (rootFolder) {
            pid = rootFolder.id;
            isRootContext = true;
        }
    }

    if (pid === null || pid === 0 || pid === -1) {

        const ownedChildren = await prisma.folder.findMany({
            where: {
                pid: null,
                uid,
                deletedAt: null
            },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        });

        const memberships = await prisma.folderMember.findMany({
            where: {
                userId: uid,
                folder: { deletedAt: null }
            },
            include: {
                folder: {
                    include: {
                        user: { select: { id: true, name: true, email: true } }
                    }
                }
            },
        });

        const sharedRootFolders = memberships
            .map(m => ({ ...m.folder, userRole: m.role, isShared: true }))
            .filter(
                f =>
                    f.uid !== uid &&
                    f.deletedAt === null
            );

        const seen = new Set(
            ownedChildren.map(f => f.id)
        );

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

    const folder = await prisma.folder.findFirst({
        where: {
            id: pid,
            deletedAt: null
        },
        include: {
            files: {
                where: {
                    deletedAt: null
                }
            },
            children: {
                where: {
                    deletedAt: null
                },
                include: {
                    user: { select: { id: true, name: true, email: true } }
                }
            },
            user: { select: { id: true, name: true, email: true } }
        },
    });

    if (!folder) {
        return null;
    }

    const hasAccess = await checkAccess(
        pid,
        uid,
        FolderAction.READ
    );

    if (!hasAccess) {
        throw new Error("Folder access denied");
    }

    if (folder.isRoot || isRootContext) {
        const memberships = await prisma.folderMember.findMany({
            where: {
                userId: uid,
                folder: { deletedAt: null }
            },
            include: {
                folder: {
                    include: {
                        user: { select: { id: true, name: true, email: true } }
                    }
                }
            },
        });

        const ownShared = await prisma.folder.findMany({
            where: {
                uid,
                isShared: true,
                deletedAt: null,
                pid: null
            },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        });

        const seen = new Set(folder.children.map(f => f.id));
        const allChildren = [...folder.children];

        for (const f of ownShared) {
            if (!seen.has(f.id)) {
                allChildren.push({ ...f, userRole: "OWNER", isShared: true });
                seen.add(f.id);
            }
        }

        for (const m of memberships) {
            if (m.folder && !seen.has(m.folder.id)) {
                allChildren.push({ ...m.folder, userRole: m.role, isShared: true });
                seen.add(m.folder.id);
            }
        }

        folder.children = allChildren;
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

export const softDeleteFolder = async (id, tx = prisma) => {
    const subfolderRows = await subfolders(id);
    const folderIds = subfolderRows.map(f => f.id);
    if (!folderIds.includes(id)) {
        folderIds.push(id);
    }
    const now = new Date();

    await tx.folder.updateMany({
        where: {
            id: { in: folderIds }
        },
        data: {
            deletedAt: now
        }
    });

    await tx.file.updateMany({
        where: {
            folderId: { in: folderIds }
        },
        data: {
            deletedAt: now
        }
    });

    return await tx.folder.findUnique({
        where: { id }
    });
};

export const permanentlyDelete = async (id, tx = prisma) => {
    return await tx.folder.delete({
        where: {
            id
        }
    });
};

export const deleteFolder = permanentlyDelete;

export const findByInviteCode = async (inviteCode) => {
    return await prisma.folder.findFirst({
        where: {
            inviteCode,
            deletedAt: null
        }
    });
};

export const findById = async (id) => {
    return await prisma.folder.findFirst({
        where: {
            id,
            deletedAt: null
        }
    });
};

export const findActiveById = async (id) => {
    return await findById(id);
};

export const findDeletedById = async (id) => {
    return await prisma.folder.findFirst({
        where: {
            id,
            deletedAt: {
                not: null
            }
        }
    });
};

export const findAnyById = async (id) => {
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
    return await prisma.folder.findFirst({
        where: { id: folderId, deletedAt: null },
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
            where: { pid: currentId, deletedAt: null },
            select: { id: true }
        });
        for (const sub of subfolders) {
            folderIds.push(sub.id);
        }
        index++;
    }

    const files = await prisma.file.findMany({
        where: {
            folderId: { in: folderIds },
            deletedAt: null
        },
        select: {
            size: true
        }
    });

    const filesCount = files.length;
    const storageUsed = files.reduce((acc, file) => acc + file.size, 0);

    return { filesCount, storageUsed };
};

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

/* ── Dashboard Stats ─────────────────────────────────────────────── */

export const getDashboardStats = async (uid) => {
    const [totalFolders, projects, sharedWithMe] = await Promise.all([
        // All own folders (non-root, non-deleted)
        prisma.folder.count({
            where: { uid, isRoot: false, deletedAt: null }
        }),
        // Projects = own shared folders
        prisma.folder.count({
            where: { uid, isShared: true, deletedAt: null }
        }),
        // Shared with me = folders where user is a member but NOT the owner
        prisma.folderMember.count({
            where: {
                userId: uid,
                role: { not: "OWNER" },
                folder: { deletedAt: null }
            }
        })
    ]);

    return { totalFolders, projects, sharedWithMe };
};

/* ── All User Projects (Owned + Member of) ─────────────────────────── */

export const getUserProjects = async (uid) => {
    const ownedProjects = await prisma.folder.findMany({
        where: {
            uid,
            isShared: true,
            deletedAt: null
        },
        include: {
            user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { updatedAt: 'desc' }
    });

    const memberships = await prisma.folderMember.findMany({
        where: {
            userId: uid,
            folder: { deletedAt: null }
        },
        include: {
            folder: {
                include: {
                    user: { select: { id: true, name: true, email: true } }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const projectMap = new Map();

    for (const folder of ownedProjects) {
        projectMap.set(folder.id, {
            ...folder,
            userRole: "OWNER",
            isShared: true
        });
    }

    for (const m of memberships) {
        if (m.folder) {
            const existing = projectMap.get(m.folder.id);
            if (!existing) {
                projectMap.set(m.folder.id, {
                    ...m.folder,
                    userRole: m.role || "MEMBER",
                    isShared: true
                });
            } else if (existing.userRole !== "OWNER") {
                existing.userRole = m.role || existing.userRole;
            }
        }
    }

    return Array.from(projectMap.values());
};

