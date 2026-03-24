import { describe, it, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import { ExercisesService } from './exercises.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof mock.fn<any>>;

function createMockPrisma() {
  return {
    exerciseSession: {
      create: mock.fn() as MockFn,
      findUnique: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
    },
    sessionAnswer: {
      createMany: mock.fn() as MockFn,
    },
  };
}

function createMockProgressService() {
  return {
    initializeProgressForTopic: mock.fn(async () => {}) as MockFn,
    getNextItems: mock.fn() as MockFn,
    markItemsSeen: mock.fn(async () => {}) as MockFn,
    recordAttempts: mock.fn(async () => {}) as MockFn,
    resetCycle: mock.fn(async () => {}) as MockFn,
  };
}

function createMockGamificationService() {
  return {
    awardXpAndUpdateStreak: mock.fn() as MockFn,
  };
}

describe('ExercisesService', () => {
  let service: ExercisesService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let progressService: ReturnType<typeof createMockProgressService>;
  let gamificationService: ReturnType<typeof createMockGamificationService>;

  beforeEach(() => {
    prisma = createMockPrisma();
    progressService = createMockProgressService();
    gamificationService = createMockGamificationService();
    service = new ExercisesService(
      prisma as never,
      progressService as never,
      gamificationService as never,
    );
  });

  describe('createSession', () => {
    it('should create a session with available words', async () => {
      progressService.getNextWords.mock.mockImplementation(async () => ({
        words: [
          {
            id: 'w1',
            baseForm: 'kruh',
            pluralForm: 'kruhovi',
            translationRu: 'хлеб',
            translationUk: 'хліб',
            translationEn: 'bread',
          },
        ],
        cycleExhausted: false,
      }));

      prisma.exerciseSession.create.mock.mockImplementation(async () => ({
        id: 'session1',
        exerciseType: 'FLASHCARDS',
        wordSetId: 'ws1',
        status: 'IN_PROGRESS',
        totalQuestions: 1,
      }));

      const result = await service.createSession('user1', 'ws1', 'FLASHCARDS' as never);

      assert.equal(result.cycleExhausted, false);
      assert.ok(result.session);
      assert.equal(result.session.words.length, 1);
      assert.equal(result.session.words[0].baseForm, 'kruh');
    });

    it('should return cycleExhausted when no words available', async () => {
      progressService.getNextWords.mock.mockImplementation(async () => ({
        words: [],
        cycleExhausted: true,
      }));

      const result = await service.createSession('user1', 'ws1', 'FLASHCARDS' as never);

      assert.equal(result.cycleExhausted, true);
      assert.equal(result.session, null);
    });
  });

  describe('finishSession', () => {
    it('should process results and award XP', async () => {
      prisma.exerciseSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        exerciseType: 'FLASHCARDS',
        status: 'IN_PROGRESS',
        totalQuestions: 3,
      }));

      prisma.sessionAnswer.createMany.mock.mockImplementation(async () => ({ count: 3 }));
      prisma.exerciseSession.update.mock.mockImplementation(async () => ({}));

      gamificationService.awardXpAndUpdateStreak.mock.mockImplementation(async () => ({
        xpEarned: 20,
        xpTotal: 120,
        currentStreak: 2,
        longestStreak: 5,
      }));

      const answers = [
        { wordId: 'w1', givenAnswer: 'bread', isCorrect: true },
        { wordId: 'w2', givenAnswer: 'wrong', isCorrect: false },
        { wordId: 'w3', givenAnswer: 'cheese', isCorrect: true },
      ];

      const result = await service.finishSession('user1', 'session1', answers);

      assert.equal(result.correctAnswers, 2);
      assert.equal(result.totalQuestions, 3);
      assert.equal(result.xpEarned, 20);
      assert.equal(result.newXpTotal, 120);
      assert.equal(result.currentStreak, 2);
    });

    it('should handle 0 correct answers', async () => {
      prisma.exerciseSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        exerciseType: 'FLASHCARDS',
        status: 'IN_PROGRESS',
        totalQuestions: 2,
      }));

      prisma.sessionAnswer.createMany.mock.mockImplementation(async () => ({ count: 2 }));
      prisma.exerciseSession.update.mock.mockImplementation(async () => ({}));

      gamificationService.awardXpAndUpdateStreak.mock.mockImplementation(async () => ({
        xpEarned: 0,
        xpTotal: 50,
        currentStreak: 1,
        longestStreak: 3,
      }));

      const answers = [
        { wordId: 'w1', givenAnswer: 'wrong1', isCorrect: false },
        { wordId: 'w2', givenAnswer: 'wrong2', isCorrect: false },
      ];

      const result = await service.finishSession('user1', 'session1', answers);

      assert.equal(result.correctAnswers, 0);
      assert.equal(result.xpEarned, 0);
    });

    it('should reject finishing a completed session', async () => {
      prisma.exerciseSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'user1',
        exerciseType: 'FLASHCARDS',
        status: 'COMPLETED',
        totalQuestions: 2,
      }));

      await assert.rejects(() => service.finishSession('user1', 'session1', []), {
        name: 'ForbiddenException',
      });
    });

    it('should reject finishing another user session', async () => {
      prisma.exerciseSession.findUnique.mock.mockImplementation(async () => ({
        id: 'session1',
        userId: 'other-user',
        exerciseType: 'FLASHCARDS',
        status: 'IN_PROGRESS',
        totalQuestions: 2,
      }));

      await assert.rejects(() => service.finishSession('user1', 'session1', []), {
        name: 'ForbiddenException',
      });
    });
  });
});
