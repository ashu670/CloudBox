import * as repo from "../repositories/folderRepo.js";
import generateInviteCode from "../utils/inviteCodeGenerator.js";
import * as memberRepo from "../repositories/folderMemberRepo.js";
import * as requestRepo from "../repositories/folderJoinRequestRepo.js";

const validateFolder = async (id, uid) => {
    if (!id) return true;

    const folder = await repo.findByIdAndUser(id, uid);

    return !!folder;
};

export const createFolder = async (name, pid, uid) => {

    const isValid = await validateFolder(pid, uid);

    if (!isValid)
        throw new Error("Parent folder not found or access denied");

    let uniqueName = name;
    let count = 1;

    while (true) {

        const exists = await repo.findDuplicate(
            uniqueName,
            pid,
            uid
        );

        if (!exists)
            break;

        uniqueName = `${name}${count}`;
        count++;
    }

    return await repo.create({
        name: uniqueName,
        pid,
        uid
    });
};

export const fetchFolder = async (uid, pid) => {

    if (pid === -1)
        pid = null;

    const valid = await validateFolder(pid, uid);

    if (!valid)
        throw new Error("Parent folder not found or access denied");

    return await repo.findChildren(uid, pid);
};

export const delFolder = async (uid, id) => {

    const valid = await validateFolder(id, uid);

    if (!valid)
        throw new Error("Folder not found or access denied");

    return await repo.deleteFolder(id);
};




export const createSharedFolder = async (name, uid) => {

    let inviteCode;

    while (true) {

        inviteCode = generateInviteCode();

        const exists = await repo.findByInviteCode(inviteCode);

        if (!exists)
            break;
    }

    const folder = await repo.create({
        name,
        uid,
        isShared: true,
        inviteCode,
        isInviteActive: true
    });


    await memberRepo.create({
        folderId: folder.id,
        userId: uid,
        role: "OWNER"
    });


    return {
    folderId: folder.id,
    folderName: folder.name,
    inviteCode: folder.inviteCode,
    role: "OWNER"
    };
};


export const joinSharedFolder = async (
    inviteCode,
    uid
) => {

    console.log("\n========== JOIN DEBUG ==========");

    console.log("UID =", uid);
    console.log("Invite Code =", inviteCode);

    const folder =
        await repo.findByInviteCode(inviteCode);

    console.log("FULL FOLDER =", folder);

    if (!folder) {
        throw new Error("Invalid invite code.");
    }

    if (!folder.isShared) {
        throw new Error("This folder is not shared.");
    }

    if (!folder.isInviteActive) {
        throw new Error("Invite code is disabled.");
    }

    console.log("Folder ID =", folder.id);

    const member =
        await memberRepo.findMember(
            folder.id,
            uid
        );

    console.log("MEMBER =", member);

    if (member) {
        throw new Error(
            "You are already a member."
        );
    }

    const request =
        await requestRepo.findRequest(
            folder.id,
            uid
        );

    console.log("REQUEST =", request);

    if (request) {
        throw new Error(
            "Join request already exists."
        );
    }

    await requestRepo.create({

        folderId: folder.id,

        requestedBy: uid

    });

    console.log("Join request created successfully.");
    console.log("=================================\n");

    return {
        folderName: folder.name,
        status: "PENDING"
    };

};

export const getFolderRequests = async (
    folderId,
    uid
) => {

    const folder =
        await repo.findById(folderId);


    if (!folder) {
        throw new Error(
            "Folder not found."
        );
    }


    if (folder.uid !== uid) {
        throw new Error(
            "You are not authorized."
        );
    }


    if (!folder.isShared) {
        throw new Error(
            "This folder is not shared."
        );
    }


    const requests =
        await requestRepo.findByFolderId(
            folderId
        );


    if (!requests.length) {
        throw new Error(
            "No join requests found."
        );
    }


    return requests;

};


export const approveRequest = async (requestId, uid) => {

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
        throw new Error("You are not authorized to approve this request.");
    }

    const member = await memberRepo.findMember(
        request.folderId,
        request.requestedBy
    );

    if (member) {
        throw new Error("User is already a member of this folder.");
    }

    await requestRepo.updateStatus(
    request.id,
    "APPROVED"
);

    await memberRepo.create({
    folderId: request.folderId,
    userId: request.requestedBy,
    role: "VIEWER"
    });

    return {
    folderId: request.folderId,
    userId: request.requestedBy,
    role: "VIEWER"
    };

};


export const rejectRequest = async (requestId, uid) => {

    const request = await requestRepo.findById(requestId);

    if (!request) {
        throw new Error("Join request not found.");
    }

    if (request.status !== "PENDING") {
        throw new Error(
            "This request has already been processed."
        );
    }

    const folder = await repo.findById(request.folderId);

    if (!folder) {
        throw new Error("Folder not found.");
    }

    if (folder.uid !== uid) {
        throw new Error(
            "You are not authorized to reject this request."
        );
    }

    await requestRepo.updateStatus(
        request.id,
        "REJECTED"
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

    const member = await memberRepo.findMember(
        folderId,
        uid
    );

    if (!member) {
        throw new Error(
            "You are not a member of this folder."
        );
    }

    const members = await memberRepo.getFolderMembers(
        folderId
    );

    return members.map((member) => ({
        userId: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role
    }));
};