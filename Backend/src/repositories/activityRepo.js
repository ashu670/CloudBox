import { prisma } from "../config/db.js";

export const create = async (data, tx) => {
    const client = tx || prisma;
    return await client.activityLogs.create({
        data: {
            folderId: Number(data.folderId),
            userId: Number(data.userId),
            action: data.action,
            target: data.target,
            targetId: data.targetId ? Number(data.targetId) : null,
            message: data.message || null,
        }
    });
};

export const findByFolderId = async (folderId) => {
    return await prisma.activityLogs.findMany({
        where: { folderId: Number(folderId) },
        include: {
            user: {
                select: { id: true, name: true, email: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });
};
