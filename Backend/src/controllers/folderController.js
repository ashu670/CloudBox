import * as services from "../services/folderService.js";

export const create = (req, res) => {
    return res.status(200).json({message : "creating folder"});
}