-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "NativeLanguage" AS ENUM ('RU', 'UK', 'EN');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('JEDNINA_MNOZINA', 'FLASHCARDS', 'MULTIPLE_CHOICE', 'FILL_IN_BLANK');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentPlatform" AS ENUM ('STRIPE', 'APP_STORE', 'GOOGLE_PLAY');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('EUR', 'USD');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "nativeLanguage" "NativeLanguage",
    "googleId" TEXT,
    "appleId" TEXT,
    "xpTotal" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastPracticeDate" TIMESTAMP(3),
    "expoPushToken" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "intervalMonths" INTEGER NOT NULL,
    "priceEur" DECIMAL(10,2) NOT NULL,
    "priceUsd" DECIMAL(10,2) NOT NULL,
    "stripePriceIdEur" TEXT,
    "stripePriceIdUsd" TEXT,
    "rcProductIdIos" TEXT,
    "rcProductIdAndroid" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "platform" "PaymentPlatform",
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "currency" "Currency",
    "trialStartedAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "rcOriginalAppUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "nameHr" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameUk" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordSet" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "nameHr" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameUk" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "wordSetId" TEXT NOT NULL,
    "baseForm" TEXT NOT NULL,
    "pluralForm" TEXT,
    "translationRu" TEXT NOT NULL,
    "translationUk" TEXT NOT NULL,
    "translationEn" TEXT NOT NULL,
    "sentenceHr" TEXT,
    "sentenceBlankAnswer" TEXT,
    "wrongOptions" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordExerciseConfig" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "exerciseType" "ExerciseType" NOT NULL,

    CONSTRAINT "WordExerciseConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWordProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "exerciseType" "ExerciseType" NOT NULL,
    "seenInCurrentCycle" BOOLEAN NOT NULL DEFAULT false,
    "cycleNumber" INTEGER NOT NULL DEFAULT 1,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "correctAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3),
    "lastCorrectAt" TIMESTAMP(3),

    CONSTRAINT "UserWordProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseType" "ExerciseType" NOT NULL,
    "wordSetId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExerciseSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionAnswer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "givenAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "SessionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreakLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StreakLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_appleId_key" ON "User"("appleId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_externalEventId_key" ON "WebhookEvent"("externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "WordExerciseConfig_wordId_exerciseType_key" ON "WordExerciseConfig"("wordId", "exerciseType");

-- CreateIndex
CREATE UNIQUE INDEX "UserWordProgress_userId_wordId_exerciseType_key" ON "UserWordProgress"("userId", "wordId", "exerciseType");

-- CreateIndex
CREATE UNIQUE INDEX "StreakLog_userId_date_key" ON "StreakLog"("userId", "date");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordSet" ADD CONSTRAINT "WordSet_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_wordSetId_fkey" FOREIGN KEY ("wordSetId") REFERENCES "WordSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordExerciseConfig" ADD CONSTRAINT "WordExerciseConfig_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWordProgress" ADD CONSTRAINT "UserWordProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWordProgress" ADD CONSTRAINT "UserWordProgress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSession" ADD CONSTRAINT "ExerciseSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSession" ADD CONSTRAINT "ExerciseSession_wordSetId_fkey" FOREIGN KEY ("wordSetId") REFERENCES "WordSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAnswer" ADD CONSTRAINT "SessionAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExerciseSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAnswer" ADD CONSTRAINT "SessionAnswer_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakLog" ADD CONSTRAINT "StreakLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
