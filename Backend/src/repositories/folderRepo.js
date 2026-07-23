import { prisma } from "../config/db.js";

export const canAccessFolder = async (folderId, uid) => {
    if (!folderId) return true;

    const folder = await prisma.folder.findUnique({
        where: { id: folderId },
        select: { uid: true, pid: true },
    });

    if (!folder) return false;
    if (folder.uid === uid) return true;

    let currentId = folderId;
    while (currentId) {
        const member = await prisma.folderMember.findUnique({
            where: {
                folderId_userId: { folderId: currentId, userId: uid },
            },
        });
        if (member) return true;

        const current = await prisma.folder.findUnique({
            where: { id: currentId },
            select: { pid: true },
        });
        if (!current?.pid) break;
        currentId = current.pid;
    }

    return false;
};

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

    const hasAccess = await canAccessFolder(pid, uid);
    if (!hasAccess) {
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