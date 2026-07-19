import * as repo from "../repositories/folderRepo.js";

const validateFolder = async (id, uid) => {
    if (!id) return true;

    const folder = await repo.findByIdAndUser(id, uid);

    return !!folder;
};

export const createFolder = async (name, pid, uid) => {

    const isValid = await validateFolder(pid, uid);

    if (!isValid)
        throw new Error("Parent folder not found or access denied");

    let uniqueName = name;
    let count = 1;

    while (true) {

        const exists = await repo.findDuplicate(
            uniqueName,
            pid,
            uid
        );

        if (!exists)
            break;

        uniqueName = `${name}${count}`;
        count++;
    }

    return await repo.create({
        name: uniqueName,
        pid,
        uid
    });
};

export const fetchFolder = async (uid, pid) => {

    if (pid === -1)
        pid = null;

    const valid = await validateFolder(pid, uid);

    if (!valid)
        throw new Error("Parent folder not found or access denied");

    return await repo.findChildren(uid, pid);
};


export const delFolder = async (uid, id) => {

    const valid = await validateFolder(id, uid);

    if (!valid)
        throw new Error("Folder not found or access denied");

    return await repo.deleteFolder(id);
};