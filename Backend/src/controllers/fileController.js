import * as fileService from "../services/fileService.js";
import * as fileShareService from "../services/fileShareService.js";

const getErrorStatus = (error) => {
    const msg = error?.message ? error.message.toLowerCase() : "";
    if (msg.includes("access denied") || msg.includes("unauthorized")) return 403;
    if (msg.includes("not found") || msg.includes("not exists") || msg.includes("doesn't exists")) return 404;
    if (msg.includes("required") || msg.includes("invalid")) return 400;
    return 500;
};

export const uploadFile = async (req, res) => {
    try {
        const { folderId, fileName, fileSize, mimeType } = req.body;
        const uid = req.user.id;

        if (!fileName || !fileSize || !mimeType) {
            return res.status(400).json({
                success: false,
                message: "File details (fileName, fileSize, mimeType) are required."
            });
        }
        if (!folderId) {
            return res.status(400).json({
                success: false,
                message: "Folder ID is required."
            });
        }

        const file = { name: fileName, size: fileSize, mimeType: mimeType };

        const uploadedFile = await fileService.uploadFile(
            file,
            folderId,
            uid
        );
        return res.status(201).json({
            success: true,
            message: "Url generated successfully",
            data: uploadedFile
        });

    } catch (error) {
        if (error.message === "You don't have permission to upload files.") {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to upload files.",
                error: error.message
            });
        }
        const status = getErrorStatus(error);
        return res.status(status).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

export const uploadComplete = async (req, res) => {
    const { stoName } = req.body;
    const uid = req.user.id;

    if (!stoName) return res.status(400).json({
        success: false,
        message: "Storage name is missing"
    });

    try {
        const data = await fileService.uploadComplete(stoName, uid);
        return res.status(201).json({
            success: true,
            message: "File saved successfully",
            data
        });
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({
            success: false,
            message: err.message,
            error: err.message
        });
    }
};

export const del = async (req, res) => {
    const id = Number(req.params.id);
    const uid = req.user.id;

    try {
        const response = await fileService.del(id, uid);
        return res.status(200).json({
            success: true,
            message: "File deleted successfully",
            response
        });
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({
            success: false,
            message: err.message,
            error: err.message
        });
    }
};

export const rename = async (req, res) => {
    const id = Number(req.params.id);
    const uid = req.user.id;
    const { newName } = req.body;

    try {
        const response = await fileService.renameFile(id, uid, newName);
        return res.status(200).json({
            success: true,
            message: "File renamed successfully",
            response
        });
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({
            success: false,
            message: err.message,
            error: err.message
        });
    }
};

export const move = async (req, res) => {
    const id = Number(req.params.id);
    const pid = Number(req.params.pid);
    const uid = req.user.id;
    try {
        const response = await fileService.move(id, uid, pid);
        return res.status(200).json({
            success: true,
            message: "File moved successfully",
            response
        });
    } catch (err) {
        const status = getErrorStatus(err);
        return res.status(status).json({
            success: false,
            message: err.message,
            error: err.message
        });
    }
};

export const download = async (req, res) => {
    const id = Number(req.params.id);
    const uid = req.user.id;

    try {
        const { stream, orgName, mimeType, size } = await fileService.download(id, uid);

        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Length", size);
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${encodeURIComponent(orgName)}"`
        );

        stream.pipe(res);

    } catch (err) {
        const status = getErrorStatus(err);
        console.error("Download error:", err);
        return res.status(status).json({
            success: false,
            message: err.message,
            error: err.message
        });
    }
};

export const preview = async (req, res) => {
    const uid = req.user.id;
    const id = Number(req.params.id);
    try{
        const result = await fileService.preview(id, uid);

        res.status(200).json({
            success : true,
            data : result
        })
    }
    catch(err){
        const code = getErrorStatus(err);
        res.status(code).json({
            success : false,
            Error : err.message
        })
    }
}

export const getStorageBreakdown = async (req, res) => {
    try {
        const uid = req.user.id;
        const data = await fileService.getStorageBreakdown(uid);
        return res.status(200).json({
            success: true,
            data
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
            error: err.message
        });
    }
};

export const share = async (req, res) => {
    try {
        const fileId = req.params.id;
        const uid = req.user.id;
        const { duration } = req.body || {};

        const fileShare = await fileShareService.createFileShare(
            fileId,
            uid,
            duration
        );

        return res.status(201).json({
            success: true,
            message: "File share created successfully",
            data: fileShare
        });

    } catch (error) {
        if (error.message === "File not found.") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === "You don't have permission to share this file.") {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const unshare = async (req, res) => {
    try {
        const fileId = req.params.id;
        const uid = req.user.id;

        const result = await fileShareService.revokeFileShare(fileId, uid);
        return res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        const status = getErrorStatus(error);
        return res.status(status).json({
            success: false,
            message: error.message
        });
    }
};

export const getShareStatus = async (req, res) => {
    try {
        const fileId = req.params.id;
        const uid = req.user.id;

        const data = await fileShareService.getShareStatus(fileId, uid);
        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        const status = getErrorStatus(error);
        return res.status(status).json({
            success: false,
            message: error.message
        });
    }
};
