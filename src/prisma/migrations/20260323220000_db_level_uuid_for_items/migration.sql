-- AlterTable: use DB-level UUID generation for exercise item tables
ALTER TABLE "SingularPluralItem" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "FlashcardItem" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "FillInBlankItem" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
