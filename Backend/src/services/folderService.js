import * as repo from "../repositories/folderRepo.js";
import * as memberRepo from "../repositories/folderMemberRepo.js";
import * as requestRepo from "../repositories/folderJoinRequestRepo.js";
import * as userRepo from "../repositories/userRepo.js";
import * as activityService from "./activityService.js";
import { ActivityType, TargetType } from "../validations/activityValidation.js";
import { fetchByFolderIdAndUserId } from "../repositories/fileRepo.js";
import storageService from "../storage/storageService.js";
import generateInviteCode from "../utils/inviteCodeGenerator.js";
import { validateFolderAccess, canAccessFolder, FolderAction } from "./permissionService.js";

// --- Private Helpers ---

async function generateUniqueInviteCode() {
    while (true) {
        const inviteCode = generateInviteCode();
        const exists = await repo.findByInviteCode(inviteCode);
        if (!exists) return inviteCode;
    }
}

async function getEffectiveRole(folderId, userId) {
    const folder = await repo.findById(folderId);
    if (!folder) return null;
    if (folder.uid === userId) return "OWNER";

    let currentId = folderId;
    while (currentId) {
        const member = await memberRepo.findMember(currentId, userId);
        if (member) {
            return member.role;
        }

        const currentFolder = await repo.findById(currentId);
        if (!currentFolder?.pid) break;
        currentId = currentFolder.pid;
    }

    return null;
}

async function getMemberRole(folderId, userId) {
    const folder = await repo.findById(folderId);
    if (!folder) return null;
    if (folder.uid === userId) return "OWNER";

    const member = await memberRepo.findMember(folderId, userId);
    return member ? member.role : null;
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
    
    const role = await getMemberRole(folder.id, uid);
    if (role !== "OWNER" && role !== "ADMIN") {
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
    if (pid === -1 || pid === 0 || pid === undefined || pid === null) pid = null;
    else pid = Number(pid);

    let isShared = false;
    let visibility = "PRIVATE";

    if (pid !== null) {
        const parentFolder = await repo.findById(pid);
        if (!parentFolder) {
            throw new Error("Parent folder not found");
        }

        const hasCreatePermission = await canAccessFolder(pid, uid, FolderAction.CREATE);
        if (!hasCreatePermission) {
            throw new Error("You don't have permission to create folders.");
        }

        if (parentFolder.isShared) {
            isShared = true;
            visibility = parentFolder.visibility;
        }
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

    const folder = await repo.create({
        name: uniqueName,
        pid,
        uid,
        isShared,
        visibility
    });

    if (pid) {
        await activityService.log({
            folderId: pid,
            userId: uid,
            action: ActivityType.CREATE_FOLDER,
            target: TargetType.FOLDER,
            targetId: folder.id,
            message: `Created subfolder "${uniqueName}"`
        });
    }

    return folder;
};

export const fetchFolder = async (uid, pid) => {
    if (pid === -1) pid = null;

    const valid = await validateFolderAccess(pid, uid, FolderAction.READ);
    if (!valid) {
        throw new Error("Parent folder not found or access denied");
    }

    const folderDetails = await repo.findChildren(uid, pid);
    if (pid !== null && pid !== 0 && folderDetails) {
        folderDetails.userRole = await getEffectiveRole(pid, uid);
    }
    return folderDetails;
};

export const delFolder = async (uid, id, force) => {
    const valid = await validateFolderAccess(id, uid, FolderAction.DELETE);
    if (!valid) {
        throw new Error("Folder not found or access denied");
    }
    if (valid.pid) touchFolder(valid.pid);

    const filesToDelete = await fetchByFolderIdAndUserId(id, uid);
    if (filesToDelete && filesToDelete.length > 0 && !force) {
        const error = new Error(`Folder contains ${filesToDelete.length} files ! Do you want to delete ?`);
        error.requiresConfirmation = true;
        throw error;
    }

    if (filesToDelete && filesToDelete.length > 0) {
        await Promise.all(filesToDelete.map(m => storageService.delete(m.stoName)));
    }

    const deletedFolder = await repo.deleteFolder(id);

    if (valid.pid) {
        await activityService.log({
            folderId: valid.pid,
            userId: uid,
            action: ActivityType.DELETE_FOLDER,
            target: TargetType.FOLDER,
            targetId: id,
            message: `Deleted folder "${valid.name}"`
        });
    }

    return deletedFolder;
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

    await activityService.log({
        folderId: folder.id,
        userId: uid,
        action: ActivityType.SHARE_FOLDER,
        target: TargetType.FOLDER,
        targetId: folder.id,
        message: `Created shared folder "${folder.name}"`
    });

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

    await activityService.log({
        folderId: folder.id,
        userId,
        action: ActivityType.JOIN_REQUEST,
        target: TargetType.FOLDER,
        targetId: folder.id,
        message: `Requested to join folder "${folder.name}"`
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
    const role = await getMemberRole(folderId, uid);
    if (role !== "OWNER" && role !== "ADMIN") {
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

    const targetUser = await userRepo.findNameById(request.requestedBy);
    const actorUser = await userRepo.findNameById(uid);

    await requestRepo.approveJoinRequestTx(
        request.id,
        request.folderId,
        request.requestedBy,
        "VIEWER",
        uid,
        actorUser?.name || "User",
        targetUser?.name || "User"
    );

    return {
        folderId: request.folderId,
        userId: request.requestedBy,
        role: "VIEWER"
    };
};

export const rejectRequest = async (requestId, uid) => {
    const { request } = await getAndVerifyPendingRequest(requestId, uid);

    const targetUser = await userRepo.findNameById(request.requestedBy);
    const actorUser = await userRepo.findNameById(uid);

    await requestRepo.rejectJoinRequestTx(
        request.id,
        request.folderId,
        uid,
        actorUser?.name || "User",
        targetUser?.name || "User"
    );

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

    const renamedFolder = await repo.renameFolder(id, newName);

    await activityService.log({
        folderId: id,
        userId: uid,
        action: ActivityType.RENAME_FOLDER,
        target: TargetType.FOLDER,
        targetId: id,
        message: `Renamed folder to "${newName}"`
    });

    return renamedFolder;
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

    const movedFolder = await repo.move(id, newPid);

    if (newPid) {
        await activityService.log({
            folderId: newPid,
            userId: uid,
            action: ActivityType.MOVE_FOLDER,
            target: TargetType.FOLDER,
            targetId: id,
            message: `Moved folder into this directory`
        });
    }

    return movedFolder;
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

export const getOwnerPanel = async (folderId, uid) => {
    const role = await getMemberRole(folderId, uid);
    if (role !== "OWNER") {
        throw new Error("Unauthorized: Only Folder Owner can access the Owner Panel.");
    }

    const folder = await repo.findFolderWithOwnerDetails(folderId);
    if (!folder) {
        throw new Error("Folder not found.");
    }

    const allMembers = await memberRepo.getFolderMembers(folderId);
    const ownerDetails = folder.user;

    const admins = allMembers
        .filter(m => m.role === "ADMIN")
        .map(m => ({
            id: m.id,
            userId: m.user.id,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt
        }));

    const members = allMembers
        .filter(m => m.role === "EDITOR" || m.role === "VIEWER")
        .map(m => ({
            id: m.id,
            userId: m.user.id,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt
        }));

    const pendingRequests = await requestRepo.findByFolderId(folderId, "PENDING");

    const formattedPendingRequests = pendingRequests.map(r => ({
        id: r.id,
        userId: r.user.id,
        name: r.user.name,
        email: r.user.email,
        requestedAt: r.requestedAt
    }));

    const stats = await repo.getFolderStats(folderId);

    return {
        folderName: folder.name,
        inviteCode: folder.inviteCode,
        isInviteActive: folder.isInviteActive,
        visibility: folder.visibility,
        totalMembers: allMembers.length,
        pendingJoinRequests: formattedPendingRequests.length,
        filesCount: stats.filesCount,
        storageUsed: stats.storageUsed,
        owner: ownerDetails,
        members,
        admins,
        pendingRequests: formattedPendingRequests,
        currentInviteCode: folder.inviteCode
    };
};

export const getAdminPanel = async (folderId, uid) => {
    const role = await getMemberRole(folderId, uid);
    if (role !== "OWNER" && role !== "ADMIN") {
        throw new Error("Unauthorized: Only Folder Owner or Admin can access the Admin Panel.");
    }

    const folder = await repo.findFolderWithOwnerDetails(folderId);
    if (!folder) {
        throw new Error("Folder not found.");
    }

    const allMembers = await memberRepo.getFolderMembers(folderId);
    const ownerDetails = folder.user;

    const admins = allMembers
        .filter(m => m.role === "ADMIN")
        .map(m => ({
            id: m.id,
            userId: m.user.id,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt
        }));

    const members = allMembers
        .filter(m => m.role === "EDITOR" || m.role === "VIEWER")
        .map(m => ({
            id: m.id,
            userId: m.user.id,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt
        }));

    const pendingRequests = await requestRepo.findByFolderId(folderId, "PENDING");

    const formattedPendingRequests = pendingRequests.map(r => ({
        id: r.id,
        userId: r.user.id,
        name: r.user.name,
        email: r.user.email,
        requestedAt: r.requestedAt
    }));

    const stats = await repo.getFolderStats(folderId);

    return {
        folderName: folder.name,
        visibility: folder.visibility,
        totalMembers: allMembers.length,
        pendingJoinRequests: formattedPendingRequests.length,
        filesCount: stats.filesCount,
        storageUsed: stats.storageUsed,
        owner: ownerDetails,
        members,
        admins,
        pendingRequests: formattedPendingRequests
    };
};

export const removeFolderMember = async (folderId, targetUserId, actorUserId) => {
    const actorRole = await getMemberRole(folderId, actorUserId);
    if (actorRole !== "OWNER" && actorRole !== "ADMIN") {
        throw new Error("Unauthorized: Only Owner or Admin can remove members.");
    }

    const targetRole = await getMemberRole(folderId, targetUserId);
    if (!targetRole) {
        throw new Error("User is not a member of this folder.");
    }

    if (actorRole === "OWNER") {
        if (targetUserId === actorUserId) {
            throw new Error("Owner cannot remove themselves.");
        }
    } else if (actorRole === "ADMIN") {
        if (targetRole === "OWNER") {
            throw new Error("Admin cannot remove the Owner.");
        }
        if (targetRole === "ADMIN") {
            throw new Error("Admin cannot remove another Admin.");
        }
        if (targetUserId === actorUserId) {
            throw new Error("Admin cannot remove themselves.");
        }
    }

    const targetUser = await userRepo.findNameById(targetUserId);
    const actorUser = await userRepo.findNameById(actorUserId);

    await memberRepo.removeMemberTx(
        folderId,
        targetUserId,
        actorUserId,
        actorUser?.name || "User",
        targetUser?.name || "User"
    );

    return { success: true, message: "Member removed successfully." };
};

export const updateMemberRole = async (folderId, targetUserId, newRole, actorUserId) => {
    const actorRole = await getMemberRole(folderId, actorUserId);
    if (actorRole !== "OWNER") {
        throw new Error("Unauthorized: Only Folder Owner can update member roles.");
    }

    const targetRole = await getMemberRole(folderId, targetUserId);
    if (!targetRole) {
        throw new Error("Target user is not a member of this folder.");
    }

    if (targetUserId === actorUserId) {
        throw new Error("Owner cannot update their own role.");
    }

    if (newRole !== "ADMIN" && newRole !== "EDITOR" && newRole !== "VIEWER") {
        throw new Error("Invalid role specified.");
    }

    const targetUser = await userRepo.findNameById(targetUserId);
    const actorUser = await userRepo.findNameById(actorUserId);

    await memberRepo.updateRoleTx(
        folderId,
        targetUserId,
        newRole,
        actorUserId,
        actorUser?.name || "User",
        targetUser?.name || "User",
        targetRole
    );

    return { success: true, message: "Role updated successfully." };
};

export const transferOwnership = async (folderId, newOwnerUserId, actorUserId) => {
    const actorRole = await getMemberRole(folderId, actorUserId);
    if (actorRole !== "OWNER") {
        throw new Error("Unauthorized: Only Folder Owner can transfer ownership.");
    }

    if (newOwnerUserId === actorUserId) {
        throw new Error("You already own this folder.");
    }

    const targetRole = await getMemberRole(folderId, newOwnerUserId);
    if (!targetRole) {
        throw new Error("New owner must be a member of this folder.");
    }

    const newOwner = await userRepo.findNameById(newOwnerUserId);
    const actorUser = await userRepo.findNameById(actorUserId);

    await repo.transferOwnershipTx(
        folderId,
        newOwnerUserId,
        actorUserId,
        actorUser?.name || "User",
        newOwner?.name || "User"
    );

    return { success: true, message: "Ownership transferred successfully." };
};

export const regenerateInviteCode = async (folderId, actorUserId) => {
    const actorRole = await getMemberRole(folderId, actorUserId);
    if (actorRole !== "OWNER") {
        throw new Error("Unauthorized: Only Folder Owner can regenerate the invite code.");
    }

    const newCode = await generateUniqueInviteCode();
    const actorUser = await userRepo.findNameById(actorUserId);

    await repo.updateInviteCodeTx(
        folderId,
        { inviteCode: newCode, isInviteActive: true },
        actorUserId,
        actorUser?.name || "User",
        "Invite Regenerated"
    );

    return { success: true, inviteCode: newCode };
};

export const setInviteStatus = async (folderId, isInviteActive, actionType, actorUserId) => {
    const actorRole = await getMemberRole(folderId, actorUserId);
    if (actorRole !== "OWNER") {
        throw new Error("Unauthorized: Only Folder Owner can change the invite status.");
    }

    const actorUser = await userRepo.findNameById(actorUserId);

    await repo.updateInviteCodeTx(
        folderId,
        { isInviteActive },
        actorUserId,
        actorUser?.name || "User",
        actionType
    );

    return { success: true, isInviteActive };
};

export const getFolderActivities = async (folderId, uid) => {
    return await activityService.getFolderActivities(folderId, uid);
};