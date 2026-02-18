-- AlterTable
ALTER TABLE "User" ADD COLUMN "registeredByAdminId" INTEGER;

-- CreateTable
CREATE TABLE "School" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "allowSelfRegistration" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "SchoolAdmin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "schoolId" INTEGER NOT NULL,
    CONSTRAINT "SchoolAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SchoolAdmin_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Major" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "schoolId" INTEGER NOT NULL,
    CONSTRAINT "Major_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "School_value_key" ON "School"("value");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolAdmin_userId_schoolId_key" ON "SchoolAdmin"("userId", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Major_value_schoolId_key" ON "Major"("value", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_value_key" ON "Category"("value");
