import * as memberRepo from "../repositories/folderMemberRepo.js";

export const checkFolderRole = (requiredRole) => {

    return async (req, res, next) => {

        try {

            const folderId = Number(
                req.params.folderId ||
                req.body.folderId
            );

            const uid = req.user.id;

            const member = await memberRepo.findMember(
                folderId,
                uid
            );

            if (!member) {
                return res.status(403).json({
                    success: false,
                    error: "You are not a member of this folder."
                });
            }

            if (member.role !== requiredRole) {
                return res.status(403).json({
                    success: false,
                    error: "Permission denied."
                });
            }

            next();

        } catch (err) {

            return res.status(500).json({
                success: false,
                error: err.message
            });

        }

    };

};