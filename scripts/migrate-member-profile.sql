-- Member profile columns (run in Neon SQL editor if db:push prompts interactively)
DO $$ BEGIN
  CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'unspecified');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_name" varchar(100);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_name" varchar(100);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "date_of_birth" date;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" "gender";
