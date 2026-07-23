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