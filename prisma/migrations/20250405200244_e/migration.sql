/*
  Warnings:

  - Added the required column `userId` to the `Bracket` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bracket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Bracket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Bracket" ("data", "id") SELECT "data", "id" FROM "Bracket";
DROP TABLE "Bracket";
ALTER TABLE "new_Bracket" RENAME TO "Bracket";
CREATE UNIQUE INDEX "Bracket_id_key" ON "Bracket"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
