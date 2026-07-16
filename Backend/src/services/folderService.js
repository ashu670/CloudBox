import { prisma } from "../config/db.js";

const validateFolder = async (id, uid) => {
    if (!id) return true;

    const folder = await prisma.folder.findFirst({
        where: {
            id: id,
            uid: uid
        }
    });

    return !!folder;
};

export const createFolder = async (name, pid, uid) => {

    const isValid = await validateFolder(pid, uid);

    if (!isValid) throw new Error("Parent folder not found or access denied");

    let uniqueName = name;
    let count = 1;

    while (true) {

        const exists = await prisma.folder.findFirst({
            where: {
                name: uniqueName,
                pid: pid,
                uid: uid
            }
        });

        if (!exists) break;

        uniqueName = `${name}${count}`;
        count++;
    }

    const newFolder = await prisma.folder.create({
        data: {
            name: uniqueName,
            pid: pid,
            uid: uid
        }
    });

    return newFolder;
};

export const fetchFolder = async (uid, pid) => {
    if(pid === -1) pid = null;
    const validate = await validateFolder(pid, uid);
    if(!validate) throw new Error("Parent folder not found or access denied");

    const children = await prisma.folder.findMany(
        {where : {
            uid : uid,
            pid : pid
        }
    });
    return children;
}

export const delFolder = async (uid, id) => {
    const valid = await validateFolder(id, uid);
    if(!valid) return {error : "folder not found or access denied"};
    return {message : "to be implement later"};
}