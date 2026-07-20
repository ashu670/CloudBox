import { error } from "console";
import * as service from "../services/folderService.js";

const getErrorStatus = (error) => {
    const msg = error.message ? error.message.toLowerCase() : "";
    if (msg.includes("access denied") || msg.includes("unauthorized")) return 403;
    if (msg.includes("not found") || msg.includes("not exists") || msg.includes("doesn't exists")) return 404;
    if (msg.includes("required") || msg.includes("invalid") || msg.includes("cannot move")) return 400;
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