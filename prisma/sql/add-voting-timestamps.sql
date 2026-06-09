ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

ALTER TABLE "VotingSettings"
ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMP(3);

UPDATE "Product"
SET "publishedAt" = "createdAt"
WHERE "status" = 'PUBLISHED'
  AND "publishedAt" IS NULL;

UPDATE "VotingSettings"
SET "openedAt" = "updatedAt"
WHERE "isOpen" = true
  AND "openedAt" IS NULL;