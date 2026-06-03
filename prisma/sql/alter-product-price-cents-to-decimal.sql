ALTER TABLE "Product"
ALTER COLUMN "priceCents" TYPE numeric(65, 0)
USING "priceCents"::numeric(65, 0);