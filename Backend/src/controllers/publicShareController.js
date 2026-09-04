import * as fileShareService from "../services/fileShareService.js";

export const getPublicShare = async (req, res) => {
    try {
        const { token } = req.params;
        const data = await fileShareService.getFileShareByToken(token);

        return res.status(200).json({
            success: true,
            message: "Public file retrieved successfully",
            data
        });
    } catch (error) {
        if (error.message === "Invalid or expired share link.") {
            return res.status(404).json({
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
