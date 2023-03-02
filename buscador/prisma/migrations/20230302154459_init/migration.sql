/*
  Warnings:

  - Added the required column `deep` to the `Page` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Page" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "deep" INTEGER NOT NULL,
    "score" INTEGER NOT NULL
);
INSERT INTO "new_Page" ("id", "score", "term", "url") SELECT "id", "score", "term", "url" FROM "Page";
DROP TABLE "Page";
ALTER TABLE "new_Page" RENAME TO "Page";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
