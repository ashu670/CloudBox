import * as memberRepo from "../repositories/folderMemberRepo.js";
import { prisma } from "../config/db.js";

export const checkFolderRole = (requiredRoles) => {

    return async (req, res, next) => {

        try {

            const folderId = Number(
                req.params.folderId ||
                req.body.folderId ||
                req.query.folderId
            );

            const uid = req.user.id;

            if (isNaN(folderId)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid or missing folder ID."
                });
            }

            const folder = await prisma.folder.findUnique({
                where: { id: folderId }
            });

            if (!folder) {
                return res.status(404).json({
                    success: false,
                    error: "Folder not found."
                });
            }

            const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

            // Owner fallback check
            if (folder.uid === uid) {
                if (rolesToCheck.includes("OWNER")) {
                    return next();
                }
            }

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

            if (!rolesToCheck.includes(member.role)) {
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