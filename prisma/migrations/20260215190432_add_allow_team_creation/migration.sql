-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_School" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "allowSelfRegistration" BOOLEAN NOT NULL DEFAULT true,
    "allowTeamCreation" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_School" ("allowSelfRegistration", "id", "label", "value") SELECT "allowSelfRegistration", "id", "label", "value" FROM "School";
DROP TABLE "School";
ALTER TABLE "new_School" RENAME TO "School";
CREATE UNIQUE INDEX "School_value_key" ON "School"("value");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
