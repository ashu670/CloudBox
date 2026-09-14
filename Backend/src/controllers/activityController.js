import * as activityService from "../services/activityService.js";

export const getActivities = async (req, res) => {
    try {
        const { folderId } = req.params;
        const userId = req.user.id;

        const activities = await activityService.getFolderActivities(folderId, userId);

        return res.status(200).json({
            success: true,
            data: activities,
        });
    } catch (err) {
        const message = err.message || "Failed to fetch activity logs.";
        let statusCode = 500;

        if (message.includes("Invalid Folder ID") || message.includes("Invalid User ID")) {
            statusCode = 400;
        } else if (message.includes("Unauthorized") || message.includes("Access denied")) {
            statusCode = 403;
        }

        return res.status(statusCode).json({
            success: false,
            error: message,
        });
    }
};
