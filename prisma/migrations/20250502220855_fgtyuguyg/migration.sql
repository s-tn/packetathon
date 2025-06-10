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
    "resetPasswordToken" TEXT DEFAULT '000000',
    "resetPasswordTokenExpiry" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "resetPasswordTokenUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password", "phone", "resetPasswordToken", "resetPasswordTokenExpiry", "resetPasswordTokenUsed", "verificationCode", "verificationCodeExpiry", "verified") SELECT "createdAt", "email", "id", "name", "password", "phone", "resetPasswordToken", "resetPasswordTokenExpiry", "resetPasswordTokenUsed", "verificationCode", "verificationCodeExpiry", "verified" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
