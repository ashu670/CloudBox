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



export const getFilesByFolder = async (req, res) => {
    try {
       
        const { folderId } = req.params;    // Folder ID comes from URL parameter

        const uid = req.user.id;

        const files = await fileService.getFilesByFolder(
            folderId,
            uid
        );

        // Success response
        return res.status(200).json({
            success: true,
            message: files.length
                ? "Files fetched successfully."
                : "No files found.",
            data: files
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};