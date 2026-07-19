import * as fileRepo from "../repositories/fileRepo.js";
import * as folderRepo from "../repositories/folderRepo.js";
import path from "path";

export const uploadFile = async (file, folderId, uid) => {

    folderId = Number(folderId);   // form-data se folderId string mein aata hai that's Using Number

    if (isNaN(folderId)) {       //if folder id is not detect
        throw new Error("Invalid Folder ID.");
    }

    // folder validation
    const validFolder = await folderRepo.findByIdAndUser(folderId, uid);

    if (!validFolder) {
        throw new Error("Folder not found or access denied.");
    }


    const fileName = path.parse(file.originalname).name;
    const extension = path.parse(file.originalname).ext;    // file name aur extension alag karne ke liye 

    // initial storage name
    let count = 0;
    let stoName = `${uid}_${folderId}_${fileName}${extension}`;

    while (true) {
        const exists = await fileRepo.findByStoName(stoName);
        if (!exists) {
            break;
        }
        count++;
        stoName = `${uid}_${folderId}_${fileName}${count}${extension}`;
    }

    const data = {
        orgName: file.originalname,
        stoName: stoName,
        mimeType: file.mimetype,
        size: file.size,
        folderId: folderId,
        uid: uid
    };

    return await fileRepo.create(data);   // Saving in Database
};


// Fetching

export const getFilesByFolder = async (folderId, uid) => {

    folderId = Number(folderId);     // folderId ko number mein convert karo

    if (isNaN(folderId)) {
        throw new Error("Invalid Folder ID.");
    }
    const validFolder = await folderRepo.findByIdAndUser(
        folderId,
        uid
    );
    if (!validFolder) {
        throw new Error(
            "Folder not found or access denied."
        );
    }
    const files = await fileRepo.findAllByFolderId(
        folderId                 // files fetch kar rhe 
    );

    return files;
};