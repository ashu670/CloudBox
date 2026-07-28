import * as repo from "../repositories/folderRepo.js";
import * as memberRepo from "../repositories/folderMemberRepo.js";
import * as requestRepo from "../repositories/folderJoinRequestRepo.js";
import { fetchByFolderIdAndUserId } from "../repositories/fileRepo.js";
import storageService from "../storage/storageService.js";
import generateInviteCode from "../utils/inviteCodeGenerator.js";
import { validateFolderAccess, FolderAction } from "./permissionService.js";

// --- Private Helpers ---

async function generateUniqueInviteCode() {
    while (true) {
        const inviteCode = generateInviteCode();
        const exists = await repo.findByInviteCode(inviteCode);
        if (!exists) return inviteCode;
    }
}

async function getAndVerifyPendingRequest(requestId, uid) {
    const request = await requestRepo.findById(requestId);
    if (!request) {
        throw new Error("Join request not found.");
    }
    if (request.status !== "PENDING") {
        throw new Error("This request has already been processed.");
    }

    const folder = await repo.findById(request.folderId);
    if (!folder) {
        throw new Error("Folder not found.");
    }
    if (folder.uid !== uid) {
        throw new Error("You are not authorized to manage requests for this folder.");
    }

    return { request, folder };
}

const isDescendant = async (parentFolderId, childFolderId, uid) => {
    if (!childFolderId) return false;
    if (parentFolderId === childFolderId) return true;

    const child = await repo.findByIdAndUser(childFolderId, uid);
    if (!child || child === true) return false;

    return await isDescendant(parentFolderId, child.pid, uid);
};

// --- Exported Service Methods ---

export const createFolder = async (name, pid, uid) => {
    if (pid === -1 || pid === 0) pid = null;

    const isValid = await validateFolderAccess(pid, uid, FolderAction.CREATE);
    if (!isValid) {
        throw new Error("Parent folder not found or access denied");
    }

    let uniqueName = name;
    let count = 1;

    while (true) {
        const exists = await repo.findDuplicate(uniqueName, pid, uid);
        if (!exists) break;
        uniqueName = `${name}${count}`;
        count++;
    }

    touchFolder(pid);

    return await repo.create({
        name: uniqueName,
        pid,
        uid
    });
};

export const fetchFolder = async (uid, pid) => {
    if (pid === -1) pid = null;

    const valid = await validateFolderAccess(pid, uid, FolderAction.READ);
    if (!valid) {
        throw new Error("Parent folder not found or access denied");
    }

    return await repo.findChildren(uid, pid);
};

export const delFolder = async (uid, id) => {
    const valid = await validateFolderAccess(id, uid, FolderAction.DELETE);
    if (!valid) {
        throw new Error("Folder not found or access denied");
    }
    if (valid.pid) touchFolder(valid.pid);

    const filesToDelete = await fetchByFolderIdAndUserId(id, uid);
    if(filesToDelete) await filesToDelete.map(m => {
        storageService.delete(m.stoName);
    });

    return await repo.deleteFolder(id);
};

export const createSharedFolder = async (name, uid) => {
    const inviteCode = await generateUniqueInviteCode();

    const folderData = {
        name,
        uid,
        isShared: true,
        inviteCode,
        isInviteActive: true,
        visibility: "PUBLIC"
    };

    const folder = await repo.createSharedFolderTx(folderData, uid);

    return {
        folderId: folder.id,
        folderName: folder.name,
        inviteCode: folder.inviteCode,
        role: "OWNER"
    };
};

export const joinSharedFolder = async (inviteCode, uid) => {
    const userId = Number(uid);
    if (!Number.isInteger(userId)) {
        throw new Error("Invalid user session.");
    }

    const normalizedInviteCode = inviteCode?.trim();
    if (!normalizedInviteCode) {
        throw new Error("Invite code is required.");
    }

    const folder = await repo.findByInviteCode(normalizedInviteCode);
    if (!folder) {
        throw new Error("Invalid invite code.");
    }
    if (!folder.isShared) {
        throw new Error("This folder is not shared.");
    }
    if (!folder.isInviteActive) {
        throw new Error("Invite code is disabled.");
    }

    const member = await memberRepo.findMember(folder.id, userId);
    if (member) {
        return {
            folderName: folder.name,
            status: member.role === "OWNER" ? "OWNER" : "MEMBER",
            message: member.role === "OWNER"
                ? "You already own this folder."
                : "You are already a member of this folder.",
        };
    }

    const pendingRequest = await requestRepo.findPendingRequest(folder.id, userId);
    if (pendingRequest) {
        return {
            folderName: folder.name,
            status: "PENDING",
            message: "Join request already pending approval.",
        };
    }

    await requestRepo.create({
        folderId: folder.id,
        requestedBy: userId,
    });

    return {
        folderName: folder.name,
        status: "PENDING",
        message: "Join request sent successfully.",
    };
};

export const getFolderRequests = async (folderId, uid) => {
    const folder = await repo.findById(folderId);
    if (!folder) {
        throw new Error("Folder not found.");
    }
    if (folder.uid !== uid) {
        throw new Error("You are not authorized.");
    }
    if (!folder.isShared) {
        throw new Error("This folder is not shared.");
    }

    return await requestRepo.findByFolderId(folderId, "PENDING");
};

export const approveRequest = async (requestId, uid) => {
    const { request } = await getAndVerifyPendingRequest(requestId, uid);

    const existingMember = await memberRepo.findMember(
        request.folderId,
        request.requestedBy
    );
    if (existingMember) {
        throw new Error("User is already a member of this folder.");
    }

    await requestRepo.approveJoinRequestTx(
        request.id,
        request.folderId,
        request.requestedBy,
        "VIEWER"
    );

    return {
        folderId: request.folderId,
        userId: request.requestedBy,
        role: "VIEWER"
    };
};

export const rejectRequest = async (requestId, uid) => {
    const { request } = await getAndVerifyPendingRequest(requestId, uid);

    await requestRepo.updateStatus(request.id, "REJECTED");

    return {
        requestId: request.id,
        status: "REJECTED"
    };
};

export const getFolderMembers = async (folderId, uid) => {
    folderId = Number(folderId);
    const folder = await repo.findById(folderId);
    if (!folder) {
        throw new Error("Folder not found.");
    }

    const member = await memberRepo.findMember(folderId, uid);
    if (!member && folder.uid !== uid) {
        throw new Error("You are not a member of this folder.");
    }

    const members = await memberRepo.getFolderMembers(folderId);

    return members.map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role
    }));
};

export const rename = async (id, uid, newName) => {
    if (!newName || !newName.trim()) {
        throw new Error("New folder name is required");
    }

    const valid = await validateFolderAccess(id, uid, FolderAction.RENAME);
    if (!valid) {
        throw new Error("Folder not found or access denied");
    }
    if (valid.pid) touchFolder(valid.pid);

    return await repo.renameFolder(id, newName);
};

export const move = async (id, uid, newPid) => {
    if (newPid === -1) newPid = null;

    const validCurr = await repo.findByIdAndUser(id, uid);
    if (!validCurr) {
        throw new Error("current folder doesnt exists or access denied");
    }

    if (id === newPid) {
        throw new Error("Cannot move a folder into itself.");
    }

    if (newPid !== null) {
        const isTargetDescendant = await isDescendant(id, newPid, uid);
        if (isTargetDescendant) {
            throw new Error("Cannot move a folder into its own subfolder.");
        }
    }

    const parent = await repo.findByIdAndUser(newPid, uid);
    if (!parent) {
        throw new Error("Parent folder doenst exists or access denied");
    }

    if (validCurr.pid) touchFolder(validCurr.pid);
    if (newPid) touchFolder(newPid);

    return await repo.move(id, newPid);
};

export const touchFolder = async (id) => {
    if (!id) return;
    try {
        const folder = await repo.touch(id);
        if (folder && folder.pid) {
            await touchFolder(folder.pid);
        }
    } catch (err) {
        console.error("Error in touchFolder:", err);
    }
};