/*
  Warnings:

  - Added the required column `resetPasswordToken` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resetPasswordTokenExpiry` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verificationCode` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verificationCodeExpiry` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationCode" TEXT NOT NULL,
    "verificationCodeExpiry" DATETIME NOT NULL,
    "resetPasswordToken" TEXT NOT NULL,
    "resetPasswordTokenExpiry" DATETIME NOT NULL,
    "resetPasswordTokenUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password", "phone") SELECT "createdAt", "email", "id", "name", "password", "phone" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
