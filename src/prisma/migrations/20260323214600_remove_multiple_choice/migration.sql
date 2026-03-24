-- Delete all data referencing MULTIPLE_CHOICE before altering the enum
DELETE FROM "ExerciseTopicType" WHERE "exerciseType" = 'MULTIPLE_CHOICE';
DELETE FROM "UserExerciseProgress" WHERE "exerciseType" = 'MULTIPLE_CHOICE';
DELETE FROM "ExerciseSession" WHERE "exerciseType" = 'MULTIPLE_CHOICE';

-- DropTable
DROP TABLE "MultipleChoiceItem";

-- AlterEnum: remove MULTIPLE_CHOICE from ExerciseType
ALTER TYPE "ExerciseType" RENAME TO "ExerciseType_old";
CREATE TYPE "ExerciseType" AS ENUM ('JEDNINA_MNOZINA', 'FLASHCARDS', 'FILL_IN_BLANK');
ALTER TABLE "ExerciseTopicType" ALTER COLUMN "exerciseType" TYPE "ExerciseType" USING "exerciseType"::text::"ExerciseType";
ALTER TABLE "UserExerciseProgress" ALTER COLUMN "exerciseType" TYPE "ExerciseType" USING "exerciseType"::text::"ExerciseType";
ALTER TABLE "ExerciseSession" ALTER COLUMN "exerciseType" TYPE "ExerciseType" USING "exerciseType"::text::"ExerciseType";
DROP TYPE "ExerciseType_old";
