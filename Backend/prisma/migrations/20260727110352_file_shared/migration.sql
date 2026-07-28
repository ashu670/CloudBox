/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "inviteCode" TEXT,
ADD COLUMN     "isInviteActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isShared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE';

-- CreateIndex
CREATE UNIQUE INDEX "File_inviteCode_key" ON "File"("inviteCode");
