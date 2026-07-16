import { prisma } from "../config/db.js";

const validateFolder = async (pid, uid) => {
    if (!pid) return true;

    const folder = await prisma.folder.findFirst({
        where: {
            id: pid,
            uid: uid
        }
    });

    return !!folder;
};

export const createFolder = async (name, pid, uid) => {

    const isValid = await validateFolder(pid, uid);

    if (!isValid) {
        return { error: "Parent folder not found or access denied" };
    }

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
    if(pid === 0) pid = null;
    const validate = await validateFolder(pid, uid);
    if(!validate) return {error : "Parent folder not found or access denied"};

    const children = await prisma.folder.findMany({where : {uid : uid, pid : pid}});
    return children;
}