import { error } from "console";
import * as fileService from "../services/fileService.js";

const getErrorStatus = (error) => {
    const msg = error.message ? error.message.toLowerCase() : "";
    if (msg.includes("access denied") || msg.includes("unauthorized")) return 403;
    if (msg.includes("not found") || msg.includes("not exists") || msg.includes("doesn't exists")) return 404;
    if (msg.includes("required") || msg.includes("invalid")) return 400;
    return 500;
};

export const uploadFile = async (req, res) => {
    try {
        const file = req.file;                // File provided by multer
        const { folderId } = req.body;       // Folder ID sent from Postman
        const uid = req.user.id;            // User ID provided by auth middleware

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "File is required."
            });
        }
        if (!folderId) {
            return res.status(400).json({
                success: false,
                message: "Folder ID is required."
            });
        }
        const uploadedFile = await fileService.uploadFile(
            file,
            folderId,
            uid
        );
        return res.status(201).json({
            success: true,
            message: "File uploaded successfully.",
            data: uploadedFile
        });

    } catch (error) {
        if (error.message === "You don't have permission to upload files.") {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to upload files."
            });
        }
        const status = getErrorStatus(error);
        return res.status(status).json({
            success: false,
            message: error.message
        });
    }
};

export const del = async (req, res) => {
    const id = Number(req.params.id);
    const uid = req.user.id;

    try {
        const response = await fileService.del(id, uid);
        return res.status(200).json({message : "deleted successFully", response});
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
        const response = await fileService.renameFile(id, uid, newName);
        return res.status(200).json({message : "renamed succeful", response});
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({error : err.message});
    }
};

export const move = async (req, res) => {
    const id = Number(req.params.id);
    const pid = Number(req.params.pid);
    const uid = req.user.id;
    try {
        const response = await fileService.move(id, uid, pid);
        return res.status(200).json({message : "File moved succesfully", response});
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({error : err.message});
    }
};

export const download = async (req, res) => {
    const id = Number(req.params.id);
    const uid = req.user.id;

    try {
        const { stream, orgName, mimeType, size
        } = await fileService.download(id, uid);

        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Length", size);
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${orgName}"`
        );

        stream.pipe(res);

    } catch (err) {
        const status = getErrorStatus(err);
        console.log("Download error", err);
        return res.status(status).json({
            error: err.message
        });
    }
};