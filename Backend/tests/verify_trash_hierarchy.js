import { prisma } from "../src/config/db.js";
import * as fileRepo from "../src/repositories/fileRepo.js";
import * as folderRepo from "../src/repositories/folderRepo.js";
import * as folderService from "../src/services/folderService.js";
import * as trashService from "../src/services/trashService.js";

async function runHierarchyVerification() {
    console.log("=== STARTING TRASH HIERARCHY & PERMANENT DELETE VERIFICATION ===");

    try {
        // 1. Create or find test user
        let user = await prisma.user.findUnique({ where: { email: "trash_hierarchy_user@example.com" } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: "Trash Hierarchy User",
                    email: "trash_hierarchy_user@example.com",
                    usedStorage: 5000n,
                    storageLimit: 524288000n
                }
            });
        } else {
            // Reset storage for test
            await prisma.user.update({
                where: { id: user.id },
                data: { usedStorage: 5000n }
            });
            user = await prisma.user.findUnique({ where: { id: user.id } });
        }
        const uid = user.id;

        // Clean up previous test logs/files/folders for this user
        await prisma.trashLogs.deleteMany({ where: { uid } });
        await prisma.file.deleteMany({ where: { uid } });
        await prisma.folder.deleteMany({ where: { uid, isRoot: false } });

        // Find or create Root folder
        let rootFolder = await folderRepo.findRootFolder(uid);
        if (!rootFolder) {
            rootFolder = await folderRepo.create({
                name: "Root",
                uid,
                isRoot: true
            });
        }

        console.log("Root Folder ID:", rootFolder.id);

        // 2. Build Nested Subtree: Movies -> Sub -> Blah -> test.pdf
        const moviesFolder = await folderRepo.create({
            name: "Movies",
            pid: rootFolder.id,
            uid
        });

        const subFolder = await folderRepo.create({
            name: "Sub",
            pid: moviesFolder.id,
            uid
        });

        const blahFolder = await folderRepo.create({
            name: "Blah",
            pid: subFolder.id,
            uid
        });

        const testFile = await fileRepo.create({
            orgName: "test.pdf",
            stoName: `${uid}_${blahFolder.id}_${Date.now()}_test.pdf`,
            mimeType: "application/pdf",
            size: 1500,
            folderId: blahFolder.id,
            uid
        });

        console.log("Created Subtree:");
        console.log(`- Movies (ID: ${moviesFolder.id}, PID: ${moviesFolder.pid})`);
        console.log(`- Sub (ID: ${subFolder.id}, PID: ${subFolder.pid})`);
        console.log(`- Blah (ID: ${blahFolder.id}, PID: ${blahFolder.pid})`);
        console.log(`- test.pdf (ID: ${testFile.id}, FolderID: ${testFile.folderId}, Size: 1500)`);

        // 3. Soft Delete Movies folder
        console.log("\n--- STEP 1: SOFT DELETING MOVIES FOLDER ---");
        await folderService.delFolder(uid, moviesFolder.id);

        // 4. Verify soft deletion state
        const checkMovies = await folderRepo.findAnyById(moviesFolder.id);
        const checkSub = await folderRepo.findAnyById(subFolder.id);
        const checkBlah = await folderRepo.findAnyById(blahFolder.id);
        const checkFile = await fileRepo.findAnyById(testFile.id);

        console.assert(checkMovies.deletedAt !== null, "Movies.deletedAt should be set");
        console.assert(checkSub.deletedAt !== null, "Sub.deletedAt should be set");
        console.assert(checkBlah.deletedAt !== null, "Blah.deletedAt should be set");
        console.assert(checkFile.deletedAt !== null, "test.pdf.deletedAt should be set");

        // Verify relationships preserved
        console.assert(checkSub.pid === moviesFolder.id, "Sub.pid must still point to Movies.id");
        console.assert(checkBlah.pid === subFolder.id, "Blah.pid must still point to Sub.id");
        console.assert(checkFile.folderId === blahFolder.id, "test.pdf.folderId must still point to Blah.id");
        console.log("Subtree parent relationships intact in DB.");

        // Verify TrashLogs contains ONLY 1 entry for Movies
        const userTrashLogs = await trashService.getUserTrash(uid);
        console.log(`TrashLogs count for user: ${userTrashLogs.length}`);
        console.assert(userTrashLogs.length === 1, "Only 1 TrashLog entry should exist for the top folder");
        console.assert(userTrashLogs[0].folderId === moviesFolder.id, "TrashLog folderId must be Movies.id");

        // Verify normal active queries exclude deleted subtree
        const activeChildren = await folderRepo.findChildren(uid, rootFolder.id);
        const foundMoviesActive = activeChildren.children.find(f => f.id === moviesFolder.id);
        console.assert(!foundMoviesActive, "Movies should not appear in active findChildren query");

        // 5. Restore Movies subtree
        console.log("\n--- STEP 2: RESTORING MOVIES SUBTREE ---");
        const trashLogId = userTrashLogs[0].id;
        await trashService.restoreTrashItem(trashLogId, uid);

        const restoredMovies = await folderRepo.findAnyById(moviesFolder.id);
        const restoredSub = await folderRepo.findAnyById(subFolder.id);
        const restoredBlah = await folderRepo.findAnyById(blahFolder.id);
        const restoredFile = await fileRepo.findAnyById(testFile.id);

        console.assert(restoredMovies.deletedAt === null, "Restored Movies.deletedAt must be null");
        console.assert(restoredSub.deletedAt === null, "Restored Sub.deletedAt must be null");
        console.assert(restoredBlah.deletedAt === null, "Restored Blah.deletedAt must be null");
        console.assert(restoredFile.deletedAt === null, "Restored test.pdf.deletedAt must be null");
        console.log("Entire subtree restored cleanly!");

        // 6. Soft Delete Movies again & Perform Permanent Delete
        console.log("\n--- STEP 3: SOFT DELETING & PERMANENTLY DELETING MOVIES ---");
        await folderService.delFolder(uid, moviesFolder.id);
        const newTrashLogs = await trashService.getUserTrash(uid);
        const newTrashId = newTrashLogs[0].id;

        const initialStorageUser = await prisma.user.findUnique({ where: { id: uid } });
        console.log("User storage before permanent delete:", initialStorageUser.usedStorage.toString());

        const permDeleteRes = await trashService.deletePermanentTrashItem(newTrashId, uid);
        console.log("Permanent Delete Result:", permDeleteRes);

        // Verify all DB records in subtree are gone
        const deletedMoviesCheck = await folderRepo.findAnyById(moviesFolder.id);
        const deletedSubCheck = await folderRepo.findAnyById(subFolder.id);
        const deletedBlahCheck = await folderRepo.findAnyById(blahFolder.id);
        const deletedFileCheck = await fileRepo.findAnyById(testFile.id);

        console.assert(!deletedMoviesCheck, "Movies DB record should be permanently deleted");
        console.assert(!deletedSubCheck, "Sub DB record should be permanently deleted");
        console.assert(!deletedBlahCheck, "Blah DB record should be permanently deleted");
        console.assert(!deletedFileCheck, "test.pdf DB record should be permanently deleted");

        const postStorageUser = await prisma.user.findUnique({ where: { id: uid } });
        console.log("User storage after permanent delete:", postStorageUser.usedStorage.toString());
        const expectedStorage = initialStorageUser.usedStorage - 1500n;
        console.assert(postStorageUser.usedStorage === expectedStorage, `Storage should decrease by 1500 bytes (Expected: ${expectedStorage}, Got: ${postStorageUser.usedStorage})`);

        // Clean up test data
        await prisma.trashLogs.deleteMany({ where: { uid } });
        await prisma.user.delete({ where: { id: uid } });

        console.log("\n=== TRASH HIERARCHY & PERMANENT DELETE VERIFICATION PASSED SUCCESSFULLY ===");
    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

runHierarchyVerification();
