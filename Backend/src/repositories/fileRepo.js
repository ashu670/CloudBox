import { prisma } from "../config/db.js";


// Create file metadata in database
export const create = async (data) => {

    return await prisma.file.create({
        data
    });

};


// Find file by storage name
export const findByStoName = async (stoName) => {

    return await prisma.file.findFirst({
        where: {
            stoName
        }
    });

};


// Find all files inside a folder
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


// for example :-

// data: {
//      orgName: "Resume.pdf",
//      stoName: "ajsh7281.pdf",
//      mimeType: "application/pdf",
//      size: 25000,
//      folderId: 5,
//      uid: 7
// }
//
// -> Prisma ye query database me chala dega:
// INSERT INTO File ....