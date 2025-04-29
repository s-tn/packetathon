-- CreateTable
CREATE TABLE "Bracket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Bracket_id_key" ON "Bracket"("id");
