/*
  Warnings:

  - You are about to drop the column `deep` on the `Page` table. All the data in the column will be lost.
  - Added the required column `deep` to the `Storage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `term` to the `Storage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Storage` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Storage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "deep" INTEGER NOT NULL
);
INSERT INTO "new_Storage" ("id") SELECT "id" FROM "Storage";
DROP TABLE "Storage";
ALTER TABLE "new_Storage" RENAME TO "Storage";
CREATE TABLE "new_Page" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "storageId" INTEGER,
    CONSTRAINT "Page_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "Storage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Page" ("id", "score", "storageId", "term", "url") SELECT "id", "score", "storageId", "term", "url" FROM "Page";
DROP TABLE "Page";
ALTER TABLE "new_Page" RENAME TO "Page";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
