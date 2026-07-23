import { prisma } from "../config/db.js";

export const create = async (data) => {

    return await prisma.file.create({
        data
    });

};

export const findByStoName = async (stoName) => {

    return await prisma.file.findFirst({
        where: {
            stoName
        }
    });

};

export const findAllByFolderId = async (folderId) => {
    return await prisma.file.findMany({
        where: {
            folderId: Number(folderId)
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const findByUserId = async (id, uid) => {
    return await prisma.file.findFirst({
        where : {
            id,
            uid : uid
        }
    });
};

export const findById = async (id) => {
    return await prisma.file.findUnique({
        where: { id },
    });
};

export const delById = async (id) => {
    return await prisma.file.delete({
        where : {id}
    });
};

export const update = async (id, stoName, orgName) => {
    const data = {orgName : orgName, stoName : stoName};
    return await prisma.file.update({
        where : {id},
        data : data
    });
};

export const move = async (id, newPid) => {
    const data = {folderId : newPid};

    return await prisma.file.update({
        where : {id},
        data : data
    });
};