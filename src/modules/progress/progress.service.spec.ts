import { describe, it, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import { ProgressService } from './progress.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof mock.fn<any>>;

function createMockPrisma() {
  return {
    word: {
      findMany: mock.fn() as MockFn,
    },
    userWordProgress: {
      createMany: mock.fn() as MockFn,
      findMany: mock.fn() as MockFn,
      count: mock.fn() as MockFn,
      updateMany: mock.fn() as MockFn,
    },
  };
}

describe('ProgressService', () => {
  let service: ProgressService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ProgressService(prisma as never);
  });

  describe('initializeProgressForWordSet', () => {
    it('should create progress records for all words with matching exercise config', async () => {
      prisma.word.findMany.mock.mockImplementation(async () => [{ id: 'w1' }, { id: 'w2' }]);
      prisma.userWordProgress.createMany.mock.mockImplementation(async () => ({ count: 2 }));

      await service.initializeProgressForWordSet('user1', 'ws1', 'FLASHCARDS' as never);

      assert.equal(prisma.userWordProgress.createMany.mock.callCount(), 1);
      const call = prisma.userWordProgress.createMany.mock.calls[0];
      assert.equal(call.arguments[0].data.length, 2);
      assert.equal(call.arguments[0].skipDuplicates, true);
    });

    it('should do nothing if no words match', async () => {
      prisma.word.findMany.mock.mockImplementation(async () => []);

      await service.initializeProgressForWordSet('user1', 'ws1', 'FLASHCARDS' as never);

      assert.equal(prisma.userWordProgress.createMany.mock.callCount(), 0);
    });
  });

  describe('getNextWords', () => {
    it('should return unseen words', async () => {
      prisma.userWordProgress.findMany.mock.mockImplementation(async () => [
        {
          word: {
            id: 'w1',
            baseForm: 'kruh',
            pluralForm: 'kruhovi',
            translationRu: 'хлеб',
            translationUk: 'хліб',
            translationEn: 'bread',
            sortOrder: 1,
          },
        },
      ]);

      const result = await service.getNextWords('user1', 'FLASHCARDS' as never, 'ws1', 10);

      assert.equal(result.words.length, 1);
      assert.equal(result.cycleExhausted, false);
      assert.equal(result.words[0].baseForm, 'kruh');
    });

    it('should return cycleExhausted=true when all words seen', async () => {
      prisma.userWordProgress.findMany.mock.mockImplementation(async () => []);
      prisma.userWordProgress.count.mock.mockImplementation(async () => 5);

      const result = await service.getNextWords('user1', 'FLASHCARDS' as never, 'ws1', 10);

      assert.equal(result.words.length, 0);
      assert.equal(result.cycleExhausted, true);
    });

    it('should return cycleExhausted=false when no progress exists', async () => {
      prisma.userWordProgress.findMany.mock.mockImplementation(async () => []);
      prisma.userWordProgress.count.mock.mockImplementation(async () => 0);

      const result = await service.getNextWords('user1', 'FLASHCARDS' as never, 'ws1', 10);

      assert.equal(result.words.length, 0);
      assert.equal(result.cycleExhausted, false);
    });
  });

  describe('resetCycle', () => {
    it('should reset all progress records for the cycle', async () => {
      prisma.userWordProgress.findMany.mock.mockImplementation(async () => [
        { id: 'p1' },
        { id: 'p2' },
      ]);
      prisma.userWordProgress.updateMany.mock.mockImplementation(async () => ({ count: 2 }));

      await service.resetCycle('user1', 'FLASHCARDS' as never, 'ws1');

      assert.equal(prisma.userWordProgress.updateMany.mock.callCount(), 1);
      const call = prisma.userWordProgress.updateMany.mock.calls[0];
      assert.deepEqual(call.arguments[0].data.seenInCurrentCycle, false);
    });

    it('should do nothing if no progress records', async () => {
      prisma.userWordProgress.findMany.mock.mockImplementation(async () => []);

      await service.resetCycle('user1', 'FLASHCARDS' as never, 'ws1');

      assert.equal(prisma.userWordProgress.updateMany.mock.callCount(), 0);
    });
  });

  describe('markWordsSeen', () => {
    it('should update seen status for given words', async () => {
      prisma.userWordProgress.updateMany.mock.mockImplementation(async () => ({ count: 2 }));

      await service.markWordsSeen('user1', 'FLASHCARDS' as never, ['w1', 'w2']);

      assert.equal(prisma.userWordProgress.updateMany.mock.callCount(), 1);
      const call = prisma.userWordProgress.updateMany.mock.calls[0];
      assert.equal(call.arguments[0].data.seenInCurrentCycle, true);
    });
  });
});
