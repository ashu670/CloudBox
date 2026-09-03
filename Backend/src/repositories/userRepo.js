import { prisma } from "../config/db.js";

export const create = async (data) => {
    return await prisma.user.create({
        data : data
    })
}

export const findByEmail = async (email) => {
    return await prisma.user.findUnique({
        where : {email}
    })
}

export const findById = async (id) => {
    return await prisma.user.findUnique({
        where : {id}
    })
}

export const findNameById = async (id) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true }
    });
    return user;
}

export const findByGoogleId = async (googleId) => {
    return await prisma.user.findUnique({
        where : {googleId}
    })
}

export const updateGoogleId = async (id, googleId) => {
    return await prisma.user.update({
        where : {id},
        data : {
            googleId,
            provider : "GOOGLE"
        }
    })
}

export const createWithGoogle = async (data) => {
    return await prisma.user.create({
        data : {...data, provider : "GOOGLE"}
    })
}

export const getAvailableStorageDet = async (id) => {
    const user = await prisma.user.findUnique({
        where : {id}
    });

    const {usedStorage, storageLimit} = user;

    return {usedSize : usedStorage, limit : storageLimit};
}

export const updateStorageSize = async (id, size) => {
    return await prisma.user.update({
        where : {id},
        data : {usedStorage : size}
    });
}

export const incrementStorageSize = async (id, size) => {
    return await prisma.user.update({
        where: { id },
        data: { usedStorage: { increment: BigInt(size) } }
    });
}