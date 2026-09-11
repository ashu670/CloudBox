import { prisma } from "../src/config/db.js";
import * as fileRepo from "../src/repositories/fileRepo.js";
import * as folderRepo from "../src/repositories/folderRepo.js";
import * as userRepo from "../src/repositories/userRepo.js";
import * as fileService from "../src/services/fileService.js";
import * as folderService from "../src/services/folderService.js";
import * as trashService from "../src/services/trashService.js";

async function testTrashExpiryFlow() {
    console.log("=== STARTING TRASH EXPIRY CLEANUP VERIFICATION ===");

    try {
        // 1. Create or find test user
        let user = await prisma.user.findUnique({ where: { email: "expiry_test_user@example.com" } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: "Expiry Test User",
                    email: "expiry_test_user@example.com",
                    usedStorage: 2000n,
                    storageLimit: 524288000n
                }
            });
        }
        const uid = user.id;

        // Reset storage for clean test
        await userRepo.updateStorageSize(uid, 2000n);

        // Find or create Root folder
        let rootFolder = await folderRepo.findRootFolder(uid);
        if (!rootFolder) {
            rootFolder = await folderRepo.create({
                name: "Root",
                uid,
                isRoot: true
            });
        }

        // --- STEP 1: CREATE & SOFT DELETE FILE ---
        console.log("\n--- STEP 1: CREATE & SOFT DELETE FILE ---");
        const fileData = {
            orgName: "expiry_doc.pdf",
            stoName: `${uid}_${rootFolder.id}_${Date.now()}_expiry_doc.pdf`,
            mimeType: "application/pdf",
            size: 500,
            folderId: rootFolder.id,
            uid
        };
        const file = await fileRepo.create(fileData);
        await userRepo.incrementStorageSize(uid, 500n); // Simulate upload storage addition
        const storageAfterUpload = (await prisma.user.findUnique({ where: { id: uid } })).usedStorage;
        console.log("Storage after upload:", storageAfterUpload.toString());

        const delFileRes = await fileService.del(file.id, uid);
        console.log("File soft-deleted, TrashLog expiry:", delFileRes.expiry);

        const storageAfterFileTrash = (await prisma.user.findUnique({ where: { id: uid } })).usedStorage;
        console.log("Storage after moving file to Trash:", storageAfterFileTrash.toString());
        if (storageAfterUpload !== storageAfterFileTrash) {
            throw new Error("Storage usage changed when file was moved to Trash!");
        }

        const fileTrashLog = await prisma.trashLogs.findFirst({ where: { fileId: file.id } });
        if (!fileTrashLog) throw new Error("File TrashLog not created!");

        // --- STEP 2: CREATE & SOFT DELETE FOLDER WITH SUBFILES ---
        console.log("\n--- STEP 2: CREATE & SOFT DELETE FOLDER ---");
        const folder = await folderService.createFolder("ExpiryProject", rootFolder.id, uid);
        const subFile = await fileRepo.create({
            orgName: "notes.txt",
            stoName: `${uid}_${folder.id}_${Date.now()}_notes.txt`,
            mimeType: "text/plain",
            size: 300,
            folderId: folder.id,
            uid
        });
        await userRepo.incrementStorageSize(uid, 300n);

        const delFolderRes = await folderService.delFolder(uid, folder.id);
        console.log("Folder soft-deleted, TrashLog expiry:", delFolderRes.expiry);

        const folderTrashLog = await prisma.trashLogs.findFirst({ where: { folderId: folder.id } });
        if (!folderTrashLog) throw new Error("Folder TrashLog not created!");

        const storageBeforeCleanup = (await prisma.user.findUnique({ where: { id: uid } })).usedStorage;
        console.log("Storage before cleanup run:", storageBeforeCleanup.toString());

        // --- STEP 3: EXPIRE TRASHLOGS & RUN CLEANUP ---
        console.log("\n--- STEP 3: MANUALLY EXPIRE TRASHLOGS & RUN CLEANUP ---");
        const pastTime = new Date(Date.now() - 60 * 1000); // 1 minute in past
        await prisma.trashLogs.updateMany({
            where: { id: { in: [fileTrashLog.id, folderTrashLog.id] } },
            data: { expiry: pastTime }
        });

        console.log("Updated TrashLogs expiry to past timestamp.");

        const cleanupResult = await trashService.cleanupExpired();
        console.log("Cleanup result:", cleanupResult);

        // --- STEP 4: VERIFY PERMANENT DELETION & STORAGE RECLAMATION ---
        console.log("\n--- STEP 4: VERIFY PERMANENT DELETION & STORAGE RECLAMATION ---");
        const fileRow = await prisma.file.findUnique({ where: { id: file.id } });
        const folderRow = await prisma.folder.findUnique({ where: { id: folder.id } });
        const subFileRow = await prisma.file.findUnique({ where: { id: subFile.id } });
        const fileLogEntry = await prisma.trashLogs.findUnique({ where: { id: fileTrashLog.id } });
        const folderLogEntry = await prisma.trashLogs.findUnique({ where: { id: folderTrashLog.id } });

        console.log("File DB record exists?", !!fileRow);
        console.log("Folder DB record exists?", !!folderRow);
        console.log("SubFile DB record exists?", !!subFileRow);
        console.log("File TrashLog exists?", !!fileLogEntry);
        console.log("Folder TrashLog exists?", !!folderLogEntry);

        if (fileRow || folderRow || subFileRow || fileLogEntry || folderLogEntry) {
            throw new Error("Permanent deletion failed for one or more expired records!");
        }

        const storageAfterCleanup = (await prisma.user.findUnique({ where: { id: uid } })).usedStorage;
        console.log("Storage after cleanup:", storageAfterCleanup.toString());

        // Expected reclaimed: 500 (file) + 300 (subfile) = 800 bytes
        const expectedStorage = storageBeforeCleanup - 800n;
        console.log("Expected storage after 800 byte reclamation:", expectedStorage.toString());
        if (storageAfterCleanup !== expectedStorage) {
            throw new Error(`Storage reclamation mismatch! Expected: ${expectedStorage}, got: ${storageAfterCleanup}`);
        }

        // --- STEP 5: TEST MISSING FILE/FOLDER & ORPHANED TRASHLOG RESILIENCE ---
        console.log("\n--- STEP 5: TEST MISSING FILE/FOLDER & ORPHANED TRASHLOG RESILIENCE ---");
        const dummyFile = await fileRepo.create({
            orgName: "orphan_test.txt",
            stoName: `${uid}_${rootFolder.id}_${Date.now()}_orphan_test.txt`,
            mimeType: "text/plain",
            size: 100,
            folderId: rootFolder.id,
            uid
        });

        const orphanLog = await prisma.trashLogs.create({
            data: {
                uid,
                type: "FILE",
                fileId: dummyFile.id,
                pid: rootFolder.id,
                location: "Root",
                expiry: pastTime
            }
        });

        // Delete the file DB record directly to leave TrashLog orphaned (fileId set to null by FK onDelete: SetNull)
        await prisma.file.delete({ where: { id: dummyFile.id } });

        console.log("Created orphaned TrashLog ID:", orphanLog.id);
        const orphanCleanupResult = await trashService.cleanupExpired();
        console.log("Orphan cleanup result:", orphanCleanupResult);

        const orphanCheck = await prisma.trashLogs.findUnique({ where: { id: orphanLog.id } });
        console.log("Orphaned TrashLog removed cleanly?", !orphanCheck);
        if (orphanCheck) {
            throw new Error("Orphaned TrashLog was not cleaned up!");
        }


        // Cleanup test user & data
        await prisma.trashLogs.deleteMany({ where: { uid } });
        await prisma.activityLogs.deleteMany({ where: { userId: uid } });
        await prisma.file.deleteMany({ where: { uid } });
        await prisma.folder.deleteMany({ where: { uid } });
        await prisma.user.delete({ where: { id: uid } });

        console.log("\n=== ALL TRASH EXPIRY CLEANUP TESTS PASSED SUCCESSFULLY! ===");

    } catch (err) {
        console.error("EXPIRY CLEANUP VERIFICATION FAILED:", err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testTrashExpiryFlow();
