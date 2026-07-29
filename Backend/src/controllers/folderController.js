import { error } from "console";
import * as service from "../services/folderService.js";

const getErrorStatus = (error) => {
    const msg = error.message ? error.message.toLowerCase() : "";
    if (msg.includes("access denied") || msg.includes("unauthorized")) return 403;
    if (msg.includes("not found") || msg.includes("not exists") || msg.includes("doesn't exists")) return 404;
    if (
        msg.includes("required") ||
        msg.includes("invalid") ||
        msg.includes("cannot move") ||
        msg.includes("already a member") ||
        msg.includes("already pending") ||
        msg.includes("owner of this folder") ||
        msg.includes("not shared") ||
        msg.includes("disabled")
    ) {
        return 400;
    }
    return 500;
};

export const create = async (req, res) => {
    const { name, pid } = req.body;
    const uid = req.user.id;

    try {
        const folder = await service.createFolder(name, pid, uid);
        return res.status(201).json({
            message: "Folder created successfully",
            folder
        });
    } catch (err) {
        if (err.message === "You don't have permission to create folders.") {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to create folders."
            });
        }
        const status = getErrorStatus(err);
        return res.status(status).json({ error: err.message });
    }
};

export const fetch = async (req, res) => {
    const pid = Number(req.params.id);
    const uid = req.user.id;

    try {
        const children = await service.fetchFolder(uid, pid);
        return res.status(200).json({message : "Fetched succefull", children});
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({error : err.message});
    }
};

export const deleteFolder = async (req, res) => {
    const id = Number(req.params.id);
    const uid = req.user.id;

    try {
        const response = await service.delFolder(uid, id);
        return res.status(200).json(response);
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({error : err.message});
    }
}

export const createSharedFolder = async (req, res) => {

    const { name } = req.body;
    const uid = req.user.id;

    try {

        const folder = await service.createSharedFolder(name, uid);

        return res.status(201).json({
            success: true,
            message: "Shared folder created successfully.",
            data: folder
        });

    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({
            success: false,
            error: err.message
        });
    }

};

export const joinSharedFolder = async (req, res) => {

    const { inviteCode } = req.body;
    const uid = req.user.id;

    try {

        const response = await service.joinSharedFolder(
            inviteCode,
            uid
        );

        return res.status(200).json({
            success: true,
            message: response.message || "Join request sent successfully.",
            data: response
        });

    } catch (err) {
        const status = getErrorStatus(err);

        return res.status(status).json({
            success: false,
            error: err.message
        });

    }

};


export const getFolderRequests = async (req, res) => {

    try {

        const folderId = Number(req.params.folderId);
        const uid = req.user.id;

        const data = await service.getFolderRequests(
            folderId,
            uid
        );

        return res.status(200).json({
            success: true,
            data
        });

    } catch (err) {

        return res.status(400).json({
            success: false,
            error: err.message
        });

    }

};

export const approveRequest = async (req, res) => {

    const { requestId } = req.body;
    const uid = req.user.id;

    try {

        const data = await service.approveRequest(requestId, uid);

        return res.status(200).json({
            success: true,
            message: "Request approved successfully.",
            data
        });

    } catch (err) {

        return res.status(400).json({
            success: false,
            error: err.message
        });

    }

};


export const rejectRequest = async (req, res) => {

    const { requestId } = req.body;
    const uid = req.user.id;

    try {

        const data = await service.rejectRequest(
            requestId,
            uid
        );

        return res.status(200).json({
            success: true,
            message: "Request rejected successfully.",
            data
        });

    } catch (err) {

        return res.status(400).json({
            success: false,
            error: err.message
        });

    }

};


export const getFolderMembers = async (req, res) => {

    const folderId = Number(req.params.folderId);
    const uid = req.user.id;

    try {

        const data = await service.getFolderMembers(
            folderId,
            uid
        );

        return res.status(200).json({
            success: true,
            data
        });

    } catch (err) {

        return res.status(400).json({
            success: false,
            error: err.message
        });

    }

};

export const rename = async (req, res) => {
    const id = Number(req.params.id);
    const uid = req.user.id;
    const {newName} = req.body;

    try {
        const response = await service.rename(id, uid, newName);
        return res.status(200).json(response);
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({error : err.message});
    }
};

export const move = async (req, res) => {
    const id = Number(req.params.id);
    const uid = req.user.id;
    const newPid = Number(req.params.pid);

    try {
        const response = await service.move(id, uid, newPid);
        return res.status(200).json({message : 'folder moved successful', response});
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({error : err.message});
    }
};

export const getOwnerPanel = async (req, res) => {
    const folderId = Number(req.params.folderId);
    const uid = req.user.id;

    try {
        const data = await service.getOwnerPanel(folderId, uid);
        return res.status(200).json({ success: true, data });
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({ success: false, error: err.message });
    }
};

export const getAdminPanel = async (req, res) => {
    const folderId = Number(req.params.folderId);
    const uid = req.user.id;

    try {
        const data = await service.getAdminPanel(folderId, uid);
        return res.status(200).json({ success: true, data });
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({ success: false, error: err.message });
    }
};

export const removeFolderMember = async (req, res) => {
    const folderId = Number(req.params.folderId);
    const userId = Number(req.params.userId);
    const actorUserId = req.user.id;

    try {
        const response = await service.removeFolderMember(folderId, userId, actorUserId);
        return res.status(200).json(response);
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({ success: false, error: err.message });
    }
};

export const updateMemberRole = async (req, res) => {
    const { folderId, userId, newRole } = req.body;
    const actorUserId = req.user.id;

    try {
        const response = await service.updateMemberRole(Number(folderId), Number(userId), newRole, actorUserId);
        return res.status(200).json(response);
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({ success: false, error: err.message });
    }
};

export const transferOwnership = async (req, res) => {
    const { folderId, newOwnerUserId } = req.body;
    const actorUserId = req.user.id;

    try {
        const response = await service.transferOwnership(Number(folderId), Number(newOwnerUserId), actorUserId);
        return res.status(200).json(response);
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({ success: false, error: err.message });
    }
};

export const regenerateInviteCode = async (req, res) => {
    const { folderId } = req.body;
    const actorUserId = req.user.id;

    try {
        const response = await service.regenerateInviteCode(Number(folderId), actorUserId);
        return res.status(200).json(response);
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({ success: false, error: err.message });
    }
};

export const disableInviteCode = async (req, res) => {
    const { folderId } = req.body;
    const actorUserId = req.user.id;

    try {
        const response = await service.setInviteStatus(Number(folderId), false, "Invite Disabled", actorUserId);
        return res.status(200).json(response);
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({ success: false, error: err.message });
    }
};

export const enableInviteCode = async (req, res) => {
    const { folderId } = req.body;
    const actorUserId = req.user.id;

    try {
        const response = await service.setInviteStatus(Number(folderId), true, "Invite Enabled", actorUserId);
        return res.status(200).json(response);
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({ success: false, error: err.message });
    }
};

export const expireInviteCode = async (req, res) => {
    const { folderId } = req.body;
    const actorUserId = req.user.id;

    try {
        const response = await service.setInviteStatus(Number(folderId), false, "Invite Expired", actorUserId);
        return res.status(200).json(response);
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({ success: false, error: err.message });
    }
};

export const getFolderActivities = async (req, res) => {
    const folderId = Number(req.params.folderId);
    const uid = req.user.id;

    try {
        const data = await service.getFolderActivities(folderId, uid);
        return res.status(200).json({ success: true, data });
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({ success: false, error: err.message });
    }
};
