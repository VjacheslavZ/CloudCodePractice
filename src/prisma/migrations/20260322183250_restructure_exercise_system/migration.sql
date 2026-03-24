/*
  Warnings:

  - You are about to drop the column `wordSetId` on the `ExerciseSession` table. All the data in the column will be lost.
  - You are about to drop the column `wordId` on the `SessionAnswer` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserWordProgress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Word` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WordExerciseConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WordSet` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `topicId` to the `ExerciseSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemId` to the `SessionAnswer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ExerciseSession" DROP CONSTRAINT "ExerciseSession_wordSetId_fkey";

-- DropForeignKey
ALTER TABLE "SessionAnswer" DROP CONSTRAINT "SessionAnswer_wordId_fkey";

-- DropForeignKey
ALTER TABLE "UserWordProgress" DROP CONSTRAINT "UserWordProgress_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserWordProgress" DROP CONSTRAINT "UserWordProgress_wordId_fkey";

-- DropForeignKey
ALTER TABLE "Word" DROP CONSTRAINT "Word_wordSetId_fkey";

-- DropForeignKey
ALTER TABLE "WordExerciseConfig" DROP CONSTRAINT "WordExerciseConfig_wordId_fkey";

-- DropForeignKey
ALTER TABLE "WordSet" DROP CONSTRAINT "WordSet_categoryId_fkey";

-- AlterTable
ALTER TABLE "ExerciseSession" DROP COLUMN "wordSetId",
ADD COLUMN     "topicId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SessionAnswer" DROP COLUMN "wordId",
ADD COLUMN     "itemId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "UserWordProgress";

-- DropTable
DROP TABLE "Word";

-- DropTable
DROP TABLE "WordExerciseConfig";

-- DropTable
DROP TABLE "WordSet";

-- CreateTable
CREATE TABLE "ExerciseTopic" (
    "id" TEXT NOT NULL,
    "nameHr" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameUk" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseTopicType" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "exerciseType" "ExerciseType" NOT NULL,

    CONSTRAINT "ExerciseTopicType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SingularPluralItem" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "baseForm" TEXT NOT NULL,
    "pluralForm" TEXT NOT NULL,
    "translationRu" TEXT NOT NULL,
    "translationUk" TEXT NOT NULL,
    "translationEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SingularPluralItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardItem" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "frontText" TEXT NOT NULL,
    "translationRu" TEXT NOT NULL,
    "translationUk" TEXT NOT NULL,
    "translationEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlashcardItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MultipleChoiceItem" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "wrongOptions" JSONB NOT NULL,
    "translationRu" TEXT NOT NULL,
    "translationUk" TEXT NOT NULL,
    "translationEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MultipleChoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FillInBlankItem" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "sentenceHr" TEXT NOT NULL,
    "blankAnswer" TEXT NOT NULL,
    "translationRu" TEXT NOT NULL,
    "translationUk" TEXT NOT NULL,
    "translationEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FillInBlankItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserExerciseProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseType" "ExerciseType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "seenInCurrentCycle" BOOLEAN NOT NULL DEFAULT false,
    "cycleNumber" INTEGER NOT NULL DEFAULT 1,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "correctAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3),
    "lastCorrectAt" TIMESTAMP(3),

    CONSTRAINT "UserExerciseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseTopicType_topicId_exerciseType_key" ON "ExerciseTopicType"("topicId", "exerciseType");

-- CreateIndex
CREATE UNIQUE INDEX "UserExerciseProgress_userId_exerciseType_itemId_key" ON "UserExerciseProgress"("userId", "exerciseType", "itemId");

-- AddForeignKey
ALTER TABLE "ExerciseTopicType" ADD CONSTRAINT "ExerciseTopicType_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ExerciseTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SingularPluralItem" ADD CONSTRAINT "SingularPluralItem_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ExerciseTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardItem" ADD CONSTRAINT "FlashcardItem_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ExerciseTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MultipleChoiceItem" ADD CONSTRAINT "MultipleChoiceItem_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ExerciseTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FillInBlankItem" ADD CONSTRAINT "FillInBlankItem_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ExerciseTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserExerciseProgress" ADD CONSTRAINT "UserExerciseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserExerciseProgress" ADD CONSTRAINT "UserExerciseProgress_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ExerciseTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSession" ADD CONSTRAINT "ExerciseSession_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ExerciseTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
