import * as trashService from "../services/trashService.js";

export const getTrashList = async (req, res) => {
    try {
        const uid = req.user.id;
        const items = await trashService.getUserTrash(uid);
        return res.status(200).json({
            success: true,
            items
        });
    } catch (err) {
        console.error("Error fetching trash list:", err);
        return res.status(500).json({
            error: err.message || "Failed to fetch trash list"
        });
    }
};

export const restoreItem = async (req, res) => {
    try {
        const uid = req.user.id;
        const { id } = req.params;
        const result = await trashService.restoreTrashItem(id, uid);
        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (err) {
        console.error(`Error restoring trash item ${req.params.id}:`, err);
        return res.status(400).json({
            error: err.message || "Failed to restore trash item"
        });
    }
};

export const restoreAllItems = async (req, res) => {
    try {
        const uid = req.user.id;
        const result = await trashService.restoreAllTrash(uid);
        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (err) {
        console.error("Error restoring all trash items:", err);
        return res.status(500).json({
            error: err.message || "Failed to restore trash items"
        });
    }
};
