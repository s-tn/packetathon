-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "admin" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL DEFAULT '9',
    "school" TEXT NOT NULL DEFAULT 'bt',
    "major" TEXT NOT NULL DEFAULT 'compsci',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationCode" TEXT NOT NULL,
    "verificationCodeExpiry" DATETIME NOT NULL,
    "resetPasswordToken" TEXT DEFAULT '000000',
    "resetPasswordTokenExpiry" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "resetPasswordTokenUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "grade", "id", "major", "name", "password", "phone", "resetPasswordToken", "resetPasswordTokenExpiry", "resetPasswordTokenUsed", "school", "verificationCode", "verificationCodeExpiry", "verified") SELECT "createdAt", "email", "grade", "id", "major", "name", "password", "phone", "resetPasswordToken", "resetPasswordTokenExpiry", "resetPasswordTokenUsed", "school", "verificationCode", "verificationCodeExpiry", "verified" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON "User"("resetPasswordToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
