import { describe, it, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import { ProgressService } from './progress.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof mock.fn<any>>;

function createMockPrisma() {
  return {
    userExerciseProgress: {
      createMany: mock.fn() as MockFn,
      findMany: mock.fn() as MockFn,
      count: mock.fn() as MockFn,
      updateMany: mock.fn() as MockFn,
    },
  };
}

function createMockContentService() {
  return {
    getItemsForTopic: mock.fn() as MockFn,
    getItemsByIds: mock.fn() as MockFn,
  };
}

describe('ProgressService', () => {
  let service: ProgressService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let contentService: ReturnType<typeof createMockContentService>;

  beforeEach(() => {
    prisma = createMockPrisma();
    contentService = createMockContentService();
    service = new ProgressService(prisma as never, contentService as never);
  });

  describe('initializeProgressForTopic', () => {
    it('should create progress records for all items in the topic', async () => {
      contentService.getItemsForTopic.mock.mockImplementation(async () => [
        { id: 'item1' },
        { id: 'item2' },
      ]);
      prisma.userExerciseProgress.createMany.mock.mockImplementation(async () => ({ count: 2 }));

      await service.initializeProgressForTopic('user1', 'topic1', 'FLASHCARDS' as never);

      assert.equal(prisma.userExerciseProgress.createMany.mock.callCount(), 1);
      const call = prisma.userExerciseProgress.createMany.mock.calls[0];
      assert.equal(call.arguments[0].data.length, 2);
      assert.equal(call.arguments[0].data[0].topicId, 'topic1');
      assert.equal(call.arguments[0].skipDuplicates, true);
    });

    it('should do nothing if no items exist', async () => {
      contentService.getItemsForTopic.mock.mockImplementation(async () => []);

      await service.initializeProgressForTopic('user1', 'topic1', 'FLASHCARDS' as never);

      assert.equal(prisma.userExerciseProgress.createMany.mock.callCount(), 0);
    });
  });

  describe('getNextItems', () => {
    it('should return unseen items', async () => {
      prisma.userExerciseProgress.findMany.mock.mockImplementation(async () => [
        { itemId: 'item1' },
      ]);
      contentService.getItemsByIds.mock.mockImplementation(async () => [
        {
          id: 'item1',
          frontText: 'kruh',
          translationRu: 'хлеб',
          translationUk: 'хліб',
          translationEn: 'bread',
        },
      ]);

      const result = await service.getNextItems('user1', 'FLASHCARDS' as never, 'topic1', 10);

      assert.equal(result.items.length, 1);
      assert.equal(result.cycleExhausted, false);
    });

    it('should return cycleExhausted=true when all items seen', async () => {
      prisma.userExerciseProgress.findMany.mock.mockImplementation(async () => []);
      prisma.userExerciseProgress.count.mock.mockImplementation(async () => 5);

      const result = await service.getNextItems('user1', 'FLASHCARDS' as never, 'topic1', 10);

      assert.equal(result.items.length, 0);
      assert.equal(result.cycleExhausted, true);
    });

    it('should return cycleExhausted=false when no progress exists', async () => {
      prisma.userExerciseProgress.findMany.mock.mockImplementation(async () => []);
      prisma.userExerciseProgress.count.mock.mockImplementation(async () => 0);

      const result = await service.getNextItems('user1', 'FLASHCARDS' as never, 'topic1', 10);

      assert.equal(result.items.length, 0);
      assert.equal(result.cycleExhausted, false);
    });
  });

  describe('resetCycle', () => {
    it('should reset all progress records for the topic', async () => {
      prisma.userExerciseProgress.updateMany.mock.mockImplementation(async () => ({ count: 2 }));

      await service.resetCycle('user1', 'FLASHCARDS' as never, 'topic1');

      assert.equal(prisma.userExerciseProgress.updateMany.mock.callCount(), 1);
      const call = prisma.userExerciseProgress.updateMany.mock.calls[0];
      assert.deepEqual(call.arguments[0].data.seenInCurrentCycle, false);
    });
  });

  describe('markItemsSeen', () => {
    it('should update seen status for given items', async () => {
      prisma.userExerciseProgress.updateMany.mock.mockImplementation(async () => ({ count: 2 }));

      await service.markItemsSeen('user1', 'FLASHCARDS' as never, ['item1', 'item2']);

      assert.equal(prisma.userExerciseProgress.updateMany.mock.callCount(), 1);
      const call = prisma.userExerciseProgress.updateMany.mock.calls[0];
      assert.equal(call.arguments[0].data.seenInCurrentCycle, true);
    });
  });
});
