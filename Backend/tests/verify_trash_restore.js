import { prisma } from "../src/config/db.js";
import * as fileRepo from "../src/repositories/fileRepo.js";
import * as folderRepo from "../src/repositories/folderRepo.js";
import * as fileService from "../src/services/fileService.js";
import * as folderService from "../src/services/folderService.js";
import * as trashService from "../src/services/trashService.js";

async function testTrashRestoreFlow() {
    console.log("=== STARTING TRASH RESTORE VERIFICATION ===");

    try {
        let user = await prisma.user.findUnique({ where: { email: "trash_restore_user@example.com" } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: "Trash Restore User",
                    email: "trash_restore_user@example.com",
                    usedStorage: 1000n,
                    storageLimit: 524288000n
                }
            });
        }
        const uid = user.id;

        let rootFolder = await folderRepo.findRootFolder(uid);
        if (!rootFolder) {
            rootFolder = await folderRepo.create({
                name: "Root",
                uid,
                isRoot: true
            });
        }

        // 1. Create file and soft-delete it
        const fileData = {
            orgName: "test_restore.txt",
            stoName: `${uid}_${rootFolder.id}_${Date.now()}_test_restore.txt`,
            mimeType: "text/plain",
            size: 250,
            folderId: rootFolder.id,
            uid
        };
        const file = await fileRepo.create(fileData);
        await fileService.del(file.id, uid);

        // 2. Create folder and soft-delete it
        const folder = await folderRepo.create({
            name: "Test Restore Folder",
            pid: rootFolder.id,
            uid
        });
        await folderService.delFolder(uid, folder.id);

        // 3. Fetch trash list
        const trashList = await trashService.getUserTrash(uid);
        console.log(`Fetched ${trashList.length} trash logs for user.`);
        console.assert(trashList.length >= 2, "Trash list should have at least 2 items");

        // 4. Restore file
        const fileLog = trashList.find(item => item.type === "FILE" && item.fileId === file.id);
        console.assert(fileLog, "File log entry should exist in trash list");
        const restoredFileRes = await trashService.restoreTrashItem(fileLog.id, uid);
        console.log("Restored File Result:", restoredFileRes);

        const checkedFile = await fileRepo.findAnyById(file.id);
        console.assert(checkedFile.deletedAt === null, "File deletedAt should be null after restore");

        // 5. Restore folder
        const folderLog = trashList.find(item => item.type === "FOLDER" && item.folderId === folder.id);
        console.assert(folderLog, "Folder log entry should exist in trash list");
        const restoredFolderRes = await trashService.restoreTrashItem(folderLog.id, uid);
        console.log("Restored Folder Result:", restoredFolderRes);

        const checkedFolder = await folderRepo.findAnyById(folder.id);
        console.assert(checkedFolder.deletedAt === null, "Folder deletedAt should be null after restore");

        // Clean up test data
        await prisma.trashLogs.deleteMany({ where: { uid } });
        await prisma.file.deleteMany({ where: { uid } });
        await prisma.folder.deleteMany({ where: { uid, isRoot: false } });

        console.log("=== TRASH RESTORE VERIFICATION PASSED SUCCESSFULLY ===");
    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

testTrashRestoreFlow();
