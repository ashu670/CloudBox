/*
  Warnings:

  - You are about to drop the `FolderActivity` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CREATE_FOLDER', 'DELETE_FOLDER', 'RENAME_FOLDER', 'MOVE_FOLDER', 'UPLOAD_FILE', 'DELETE_FILE', 'RENAME_FILE', 'MOVE_FILE', 'SHARE_FOLDER', 'JOIN_REQUEST', 'APPROVE_REQUEST', 'REJECT_REQUEST', 'ROLE_CHANGED', 'MEMBER_REMOVED', 'OWNER_TRANSFERRED', 'CREATE_PR', 'APPROVE_PR', 'REJECT_PR', 'MERGE_PR');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('FOLDER', 'FILE', 'MEMBER', 'PULL_REQUEST');

-- DropForeignKey
ALTER TABLE "FolderActivity" DROP CONSTRAINT "FolderActivity_folderId_fkey";

-- DropForeignKey
ALTER TABLE "FolderActivity" DROP CONSTRAINT "FolderActivity_userId_fkey";

-- DropTable
DROP TABLE "FolderActivity";

-- CreateTable
CREATE TABLE "ActivityLogs" (
    "id" SERIAL NOT NULL,
    "folderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" "ActivityType" NOT NULL,
    "target" "TargetType" NOT NULL,
    "targetId" INTEGER,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLogs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ActivityLogs" ADD CONSTRAINT "ActivityLogs_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLogs" ADD CONSTRAINT "ActivityLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
