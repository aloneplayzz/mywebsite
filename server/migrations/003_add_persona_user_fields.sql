-- Add missing columns to personas table
ALTER TABLE "personas" ADD COLUMN IF NOT EXISTS "created_by" VARCHAR REFERENCES "users"("id");
ALTER TABLE "personas" ADD COLUMN IF NOT EXISTS "is_public" BOOLEAN DEFAULT true;
ALTER TABLE "personas" ADD COLUMN IF NOT EXISTS "is_default" BOOLEAN DEFAULT false;

-- Update existing personas to have default values
UPDATE "personas" SET "is_public" = true WHERE "is_public" IS NULL;
UPDATE "personas" SET "is_default" = true WHERE "is_default" IS NULL;

-- For existing personas without a creator, set them as system personas
UPDATE "personas" SET "created_by" = (SELECT "id" FROM "users" LIMIT 1) WHERE "created_by" IS NULL;
