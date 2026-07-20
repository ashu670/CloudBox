import { error } from "console";
import * as fileService from "../services/fileService.js";

export const uploadFile = async (req, res) => {
    try {
        const file = req.file;                // File provided by multer
        const { folderId } = req.body;       // Folder ID sent from Postman
        const uid = req.user.id;            // User ID provided by auth middleware

        // Basic validations
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
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const del = async (req, res) => {
    const id = Number(req.params.id);
    const uid = req.user.id;

    try{
        const response = await fileService.del(id, uid);
        res.status(200).json({message : "deleted successFully", response});
    }catch(err){
        res.status(500).json({error : err.message});
    }
}

export const rename = async (req, res) => {
    const id = Number(req.params.id);
    const uid = req.user.id;
    const {newName} = req.body;

    try{
        const response = await fileService.renameFile(id, uid, newName);
        res.status(200).json({message : "renamed succeful", response});
    }catch(err){
        res.status(500).json({error : err.message});
    }
}

export const move = async (req, res) => {
    const id = Number(req.params.id);
    const pid = Number(req.params.pid);
    const uid = req.user.id;
    try{
        const response = await fileService.move(id, uid, pid);
        res.status(200).json({message : "File moved succesfully", response});
    }catch(err){
        res.status(500).json({error : err.message});
    }
}