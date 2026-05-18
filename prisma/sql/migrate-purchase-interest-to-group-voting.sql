ALTER TABLE "PurchaseInterest"
ADD COLUMN IF NOT EXISTS "groupId" INTEGER;

ALTER TABLE "PurchaseInterest"
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

UPDATE "PurchaseInterest"
SET "updatedAt" = COALESCE("updatedAt", "createdAt")
WHERE "updatedAt" IS NULL;

UPDATE "PurchaseInterest" AS purchase_interest
SET "groupId" = group_member."groupId"
FROM "GroupMember" AS group_member
WHERE purchase_interest."groupId" IS NULL
  AND purchase_interest."memberId" = group_member."id";

DELETE FROM "PurchaseInterest"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "productId", "groupId"
        ORDER BY "createdAt" DESC, "id" DESC
      ) AS row_number
    FROM "PurchaseInterest"
    WHERE "groupId" IS NOT NULL
  ) AS ranked_votes
  WHERE ranked_votes.row_number > 1
);

DELETE FROM "PurchaseInterest"
WHERE "groupId" IS NULL;

ALTER TABLE "PurchaseInterest"
ALTER COLUMN "groupId" SET NOT NULL;

ALTER TABLE "PurchaseInterest"
ALTER COLUMN "updatedAt" SET NOT NULL;