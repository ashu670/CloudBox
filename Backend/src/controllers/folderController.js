import * as service from "../services/folderService.js";

export const create = async (req, res) => {

    const { name, pid } = req.body;
    const uid = req.user.id;

    const folder = await service.createFolder(name, pid, uid);

    if (folder.error) {
        return res.status(403).json(folder);
    }

    return res.status(201).json({
        message: "Folder created successfully",
        folder
    });
};

export const fetch = async (req, res) => {
    const pid = Number(req.params.id);
    const uid = req.user.id;

    try{
        const children = await service.fetchFolder(uid, pid);
        return res.status(200).json({message : "Fetched succefull", children});
    }catch(err){
        res.status(500).json({error : err.message});
    }
}

export const deleteFolder = async (req, res) => {
    const id = Number(req.params.id);
    const uid = req.user.id;

    try{
        const response = await service.delFolder(uid, id);
        return res.status(200).json(response);
    }catch(err){
        res.status(500).json({error : err.message});
    }
}