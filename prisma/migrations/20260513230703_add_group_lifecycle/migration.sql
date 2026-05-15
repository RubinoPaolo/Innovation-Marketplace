-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Group" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "editionId" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Group_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "CourseEdition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Group" ("createdAt", "editionId", "id", "name", "slug", "updatedAt") SELECT "createdAt", "editionId", "id", "name", "slug", "updatedAt" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
CREATE INDEX "Group_editionId_idx" ON "Group"("editionId");
CREATE INDEX "Group_isActive_idx" ON "Group"("isActive");
CREATE UNIQUE INDEX "Group_editionId_name_key" ON "Group"("editionId", "name");
CREATE UNIQUE INDEX "Group_editionId_slug_key" ON "Group"("editionId", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
