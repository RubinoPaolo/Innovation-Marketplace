-- CreateTable
CREATE TABLE "GroupRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "editionId" INTEGER NOT NULL,
    "groupId" INTEGER,
    "requestedByMemberId" INTEGER,
    "requestType" TEXT NOT NULL,
    "requestedGroupName" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GroupRequest_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "CourseEdition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupRequest_requestedByMemberId_fkey" FOREIGN KEY ("requestedByMemberId") REFERENCES "GroupMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupRequestMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "studentNumber" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GroupRequestMember_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "GroupRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GroupRequest_editionId_idx" ON "GroupRequest"("editionId");

-- CreateIndex
CREATE INDEX "GroupRequest_groupId_idx" ON "GroupRequest"("groupId");

-- CreateIndex
CREATE INDEX "GroupRequest_requestedByMemberId_idx" ON "GroupRequest"("requestedByMemberId");

-- CreateIndex
CREATE INDEX "GroupRequest_status_idx" ON "GroupRequest"("status");

-- CreateIndex
CREATE INDEX "GroupRequest_requestType_idx" ON "GroupRequest"("requestType");

-- CreateIndex
CREATE INDEX "GroupRequestMember_requestId_idx" ON "GroupRequestMember"("requestId");

-- CreateIndex
CREATE INDEX "GroupRequestMember_action_idx" ON "GroupRequestMember"("action");
