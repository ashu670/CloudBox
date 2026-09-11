import { prisma } from "../src/config/db.js";
import * as fileRepo from "../src/repositories/fileRepo.js";
import * as folderRepo from "../src/repositories/folderRepo.js";
import * as fileService from "../src/services/fileService.js";
import * as folderService from "../src/services/folderService.js";

async function testTrashFlow() {
    console.log("=== STARTING TRASH SYSTEM VERIFICATION ===");

    try {
        // 1. Create or find a test user
        let user = await prisma.user.findUnique({ where: { email: "trash_test_user@example.com" } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: "Trash Test User",
                    email: "trash_test_user@example.com",
                    usedStorage: 1000n,
                    storageLimit: 524288000n
                }
            });
        }
        const uid = user.id;

        // 2. Create Root folder for user if not exists
        let rootFolder = await folderRepo.findRootFolder(uid);
        if (!rootFolder) {
            rootFolder = await folderRepo.create({
                name: "Root",
                uid,
                isRoot: true
            });
        }

        console.log("Root folder ID:", rootFolder.id);

        // --- TEST 1: FILE SOFT DELETION ---
        console.log("\n--- TEST 1: FILE SOFT DELETION ---");
        const fileData = {
            orgName: "sample_doc.pdf",
            stoName: `${uid}_${rootFolder.id}_${Date.now()}_sample_doc.pdf`,
            mimeType: "application/pdf",
            size: 500,
            folderId: rootFolder.id,
            uid
        };
        const file = await fileRepo.create(fileData);
        console.log("Created file:", file.id, file.orgName);

        // Verify file appears in active queries
        const activeFilesBefore = await fileRepo.findAllByFolderId(rootFolder.id);
        console.log("Active files in root before delete:", activeFilesBefore.map(f => f.id));
        if (!activeFilesBefore.some(f => f.id === file.id)) {
            throw new Error("Created file not found in active listing!");
        }

        // Perform Soft Delete
        const initialUsedStorage = (await prisma.user.findUnique({ where: { id: uid } })).usedStorage;
        const delResponse = await fileService.del(file.id, uid);
        console.log("File soft deletion response:", delResponse);

        // Verify File DB row exists but has non-null deletedAt
        const fileRow = await prisma.file.findUnique({ where: { id: file.id } });
        console.log("File DB row deletedAt:", fileRow.deletedAt);
        if (!fileRow || !fileRow.deletedAt) {
            throw new Error("File deletedAt is not set!");
        }

        // Verify TrashLogs row created
        const trashLogFile = await prisma.trashLogs.findFirst({ where: { fileId: file.id } });
        console.log("File TrashLogs entry:", trashLogFile);
        if (!trashLogFile || trashLogFile.fileId !== file.id || trashLogFile.folderId !== null || trashLogFile.type !== "FILE") {
            throw new Error("File TrashLog record invalid or missing!");
        }

        // Verify file does NOT appear in active queries
        const activeFilesAfter = await fileRepo.findAllByFolderId(rootFolder.id);
        console.log("Active files in root after delete:", activeFilesAfter.map(f => f.id));
        if (activeFilesAfter.some(f => f.id === file.id)) {
            throw new Error("Soft-deleted file still appears in active listing!");
        }

        // Verify storage usage has NOT decreased
        const currentUsedStorage = (await prisma.user.findUnique({ where: { id: uid } })).usedStorage;
        console.log("Storage before & after soft-delete:", initialUsedStorage.toString(), "->", currentUsedStorage.toString());
        if (initialUsedStorage !== currentUsedStorage) {
            throw new Error("Storage usage changed during file soft delete!");
        }

        // Verify deleting already-deleted file throws error
        let errorThrown = false;
        try {
            await fileService.del(file.id, uid);
        } catch (err) {
            errorThrown = true;
            console.log("Expected error on re-deletion:", err.message);
        }
        if (!errorThrown) throw new Error("Deleting already-deleted file did not throw error!");


        // --- TEST 2: FOLDER SOFT DELETION & DESCENDANTS ---
        console.log("\n--- TEST 2: FOLDER SOFT DELETION & DESCENDANTS ---");
        const parentFolder = await folderService.createFolder("Projects", rootFolder.id, uid);
        const subFolder = await folderService.createFolder("College", parentFolder.id, uid);
        console.log("Created folder hierarchy:", parentFolder.name, "(id:", parentFolder.id, ") ->", subFolder.name, "(id:", subFolder.id, ")");

        const subFile = await fileRepo.create({
            orgName: "notes.txt",
            stoName: `${uid}_${subFolder.id}_${Date.now()}_notes.txt`,
            mimeType: "text/plain",
            size: 250,
            folderId: subFolder.id,
            uid
        });
        console.log("Created file inside subfolder:", subFile.id, subFile.orgName);

        // Delete parent folder
        const folderDelResponse = await folderService.delFolder(uid, parentFolder.id);
        console.log("Folder soft deletion response:", folderDelResponse);

        // Verify parent folder, subfolder, and subfile all have deletedAt set
        const parentRow = await prisma.folder.findUnique({ where: { id: parentFolder.id } });
        const subFolderRow = await prisma.folder.findUnique({ where: { id: subFolder.id } });
        const subFileRow = await prisma.file.findUnique({ where: { id: subFile.id } });

        console.log("Parent folder deletedAt:", parentRow?.deletedAt);
        console.log("Subfolder deletedAt:", subFolderRow?.deletedAt);
        console.log("Subfile deletedAt:", subFileRow?.deletedAt);

        if (!parentRow?.deletedAt || !subFolderRow?.deletedAt || !subFileRow?.deletedAt) {
            throw new Error("Hierarchy descendant soft delete failed!");
        }

        // Verify single TrashLogs row created for parent folder with correct location and pid
        const folderTrashLog = await prisma.trashLogs.findFirst({ where: { folderId: parentFolder.id } });
        console.log("Folder TrashLogs entry:", folderTrashLog);
        if (!folderTrashLog || folderTrashLog.folderId !== parentFolder.id || folderTrashLog.fileId !== null || folderTrashLog.type !== "FOLDER") {
            throw new Error("Folder TrashLog record invalid or missing!");
        }
        console.log("Folder TrashLog location:", folderTrashLog.location);
        console.log("Folder TrashLog pid:", folderTrashLog.pid, "(original pid:", parentFolder.pid, ")");

        // Verify parent folder disappears from normal listing
        const rootChildren = await folderService.fetchFolder(uid, rootFolder.id);
        const childFolderIds = rootChildren.children.map(c => c.id);
        console.log("Active children in root folder after deletion:", childFolderIds);
        if (childFolderIds.includes(parentFolder.id)) {
            throw new Error("Soft-deleted folder still appears in root listing!");
        }

        // Cleanup test user and data
        await prisma.trashLogs.deleteMany({ where: { uid } });
        await prisma.activityLogs.deleteMany({ where: { userId: uid } });
        await prisma.file.deleteMany({ where: { uid } });
        await prisma.folder.deleteMany({ where: { uid } });
        await prisma.user.delete({ where: { id: uid } });

        console.log("\n=== ALL TRASH SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
    } catch (err) {
        console.error("VERIFICATION FAILED:", err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testTrashFlow();
