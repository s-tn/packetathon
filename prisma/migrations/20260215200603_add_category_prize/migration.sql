-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "prize" REAL NOT NULL DEFAULT 0
);
INSERT INTO "new_Category" ("description", "id", "label", "value") SELECT "description", "id", "label", "value" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_value_key" ON "Category"("value");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
