import * as repo from "../repositories/folderRepo.js";

const validateFolder = async (id, uid) => {
    if (!id) return true;

    const folder = await repo.findByIdAndUser(id, uid);

    return folder;
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

    touchFolder(pid);

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

    if (!valid) throw new Error("Parent folder not found or access denied");

    return await repo.findChildren(uid, pid);
};

export const delFolder = async (uid, id) => {
    const valid = await validateFolder(id, uid);

    if (!valid) throw new Error("Folder not found or access denied");
    if (valid.pid) touchFolder(valid.pid);

    return await repo.deleteFolder(id);
};

export const rename = async (id, uid, newName) => {
    if (!newName || !newName.trim()) throw new Error("New folder name is required");

    const valid = await validateFolder(id, uid);
    if (!valid) throw new Error("Folder not found or access denied");
    if (valid.pid) touchFolder(valid.pid);

    return await repo.renameFolder(id, newName);
};

const isDescendant = async (parentFolderId, childFolderId, uid) => {
    if (!childFolderId) return false;
    if (parentFolderId === childFolderId) return true;

    const child = await repo.findByIdAndUser(childFolderId, uid);
    if (!child || child === true) return false;

    return await isDescendant(parentFolderId, child.pid, uid);
};

export const move = async (id, uid, newPid) => {
    // Normalize newPid
    if (newPid === -1) {
        newPid = null;
    }

    const validCurr = await repo.findByIdAndUser(id, uid);
    if (!validCurr) throw new Error("current folder doesnt exists or access denied");

    // Cannot move a folder into itself
    if (id === newPid) {
        throw new Error("Cannot move a folder into itself.");
    }

    // Cannot move a folder into one of its own descendants
    if (newPid !== null) {
        const isTargetDescendant = await isDescendant(id, newPid, uid);
        if (isTargetDescendant) {
            throw new Error("Cannot move a folder into its own subfolder.");
        }
    }

    const parent = await repo.findByIdAndUser(newPid, uid);
    if (!parent) throw new Error("Parent folder doenst exists or access denied");

    // Touch both old parent and new parent
    if (validCurr.pid) touchFolder(validCurr.pid);
    if (newPid) touchFolder(newPid);

    return await repo.move(id, newPid);
};

export const touchFolder = async (id) => {
    if (!id) return;
    try {
        const folder = await repo.touch(id);
        if (folder && folder.pid) {
            await touchFolder(folder.pid);
        }
    } catch (err) {
        console.error("Error in touchFolder:", err);
    }
};