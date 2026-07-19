/*
  Warnings:

  - A unique constraint covering the columns `[stoName]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "File_stoName_key" ON "File"("stoName");
