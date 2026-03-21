import { describe, it, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import { startOfDay, subDays } from 'date-fns';

import { GamificationService } from './gamification.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof mock.fn<any>>;

function createMockPrisma() {
  return {
    user: {
      findUniqueOrThrow: mock.fn() as MockFn,
      update: mock.fn() as MockFn,
    },
    streakLog: {
      upsert: mock.fn() as MockFn,
    },
  };
}

describe('GamificationService', () => {
  let service: GamificationService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new GamificationService(prisma as never);
    prisma.user.update.mock.mockImplementation(async () => ({}));
    prisma.streakLog.upsert.mock.mockImplementation(async () => ({}));
  });

  it('should calculate XP correctly', async () => {
    prisma.user.findUniqueOrThrow.mock.mockImplementation(async () => ({
      xpTotal: 100,
      currentStreak: 1,
      longestStreak: 5,
      lastPracticeDate: startOfDay(new Date()),
    }));

    const result = await service.awardXpAndUpdateStreak('user1', 3);

    assert.equal(result.xpEarned, 30);
    assert.equal(result.xpTotal, 130);
  });

  it('should set streak to 1 for first practice', async () => {
    prisma.user.findUniqueOrThrow.mock.mockImplementation(async () => ({
      xpTotal: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: null,
    }));

    const result = await service.awardXpAndUpdateStreak('user1', 1);

    assert.equal(result.currentStreak, 1);
    assert.equal(result.longestStreak, 1);
  });

  it('should increment streak for consecutive days', async () => {
    const yesterday = startOfDay(subDays(new Date(), 1));
    prisma.user.findUniqueOrThrow.mock.mockImplementation(async () => ({
      xpTotal: 50,
      currentStreak: 3,
      longestStreak: 5,
      lastPracticeDate: yesterday,
    }));

    const result = await service.awardXpAndUpdateStreak('user1', 2);

    assert.equal(result.currentStreak, 4);
    assert.equal(result.longestStreak, 5);
  });

  it('should reset streak when day is skipped', async () => {
    const twoDaysAgo = startOfDay(subDays(new Date(), 2));
    prisma.user.findUniqueOrThrow.mock.mockImplementation(async () => ({
      xpTotal: 50,
      currentStreak: 3,
      longestStreak: 5,
      lastPracticeDate: twoDaysAgo,
    }));

    const result = await service.awardXpAndUpdateStreak('user1', 1);

    assert.equal(result.currentStreak, 1);
    assert.equal(result.longestStreak, 5);
  });

  it('should not change streak for same day practice', async () => {
    const today = startOfDay(new Date());
    prisma.user.findUniqueOrThrow.mock.mockImplementation(async () => ({
      xpTotal: 50,
      currentStreak: 3,
      longestStreak: 5,
      lastPracticeDate: today,
    }));

    const result = await service.awardXpAndUpdateStreak('user1', 1);

    assert.equal(result.currentStreak, 3);
  });

  it('should update longestStreak when current exceeds it', async () => {
    const yesterday = startOfDay(subDays(new Date(), 1));
    prisma.user.findUniqueOrThrow.mock.mockImplementation(async () => ({
      xpTotal: 50,
      currentStreak: 5,
      longestStreak: 5,
      lastPracticeDate: yesterday,
    }));

    const result = await service.awardXpAndUpdateStreak('user1', 1);

    assert.equal(result.currentStreak, 6);
    assert.equal(result.longestStreak, 6);
  });

  it('should handle 0 correct answers', async () => {
    prisma.user.findUniqueOrThrow.mock.mockImplementation(async () => ({
      xpTotal: 50,
      currentStreak: 1,
      longestStreak: 3,
      lastPracticeDate: startOfDay(new Date()),
    }));

    const result = await service.awardXpAndUpdateStreak('user1', 0);

    assert.equal(result.xpEarned, 0);
    assert.equal(result.xpTotal, 50);
  });
});
