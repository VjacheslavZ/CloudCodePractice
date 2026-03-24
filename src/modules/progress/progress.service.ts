import { Injectable } from '@nestjs/common';
import { ExerciseType } from '@cro/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { ContentService } from '../content/content.service';

@Injectable()
export class ProgressService {
  constructor(
    private prisma: PrismaService,
    private contentService: ContentService,
  ) {}

  async initializeProgressForTopic(
    userId: string,
    topicId: string,
    exerciseType: ExerciseType,
  ): Promise<void> {
    const items = await this.contentService.getItemsForTopic(topicId, exerciseType);

    if (items.length === 0) return;

    await this.prisma.userExerciseProgress.createMany({
      data: items.map((item: { id: string }) => ({
        userId,
        itemId: item.id,
        topicId,
        exerciseType,
        seenInCurrentCycle: false,
        cycleNumber: 1,
      })),
      skipDuplicates: true,
    });
  }

  async getNextItems(
    userId: string,
    exerciseType: ExerciseType,
    topicId: string,
    count: number = 10,
  ): Promise<{
    items: Record<string, unknown>[];
    cycleExhausted: boolean;
  }> {
    const unseenProgress = await this.prisma.userExerciseProgress.findMany({
      where: {
        userId,
        exerciseType,
        topicId,
        seenInCurrentCycle: false,
      },
      select: { itemId: true },
      take: count,
    });

    if (unseenProgress.length > 0) {
      const itemIds = unseenProgress.map((p) => p.itemId);
      const items = await this.contentService.getItemsByIds(exerciseType, itemIds);
      return { items, cycleExhausted: false };
    }

    const totalProgress = await this.prisma.userExerciseProgress.count({
      where: { userId, exerciseType, topicId },
    });

    return { items: [], cycleExhausted: totalProgress > 0 };
  }

  async resetCycle(userId: string, exerciseType: ExerciseType, topicId: string): Promise<void> {
    await this.prisma.userExerciseProgress.updateMany({
      where: { userId, exerciseType, topicId },
      data: {
        seenInCurrentCycle: false,
        cycleNumber: { increment: 1 },
      },
    });
  }

  async markItemsSeen(
    userId: string,
    exerciseType: ExerciseType,
    itemIds: string[],
  ): Promise<void> {
    await this.prisma.userExerciseProgress.updateMany({
      where: {
        userId,
        exerciseType,
        itemId: { in: itemIds },
      },
      data: {
        seenInCurrentCycle: true,
        lastSeenAt: new Date(),
      },
    });
  }

  async recordAttempts(
    userId: string,
    exerciseType: ExerciseType,
    answers: { itemId: string; isCorrect: boolean }[],
  ): Promise<void> {
    for (const answer of answers) {
      await this.prisma.userExerciseProgress.updateMany({
        where: {
          userId,
          itemId: answer.itemId,
          exerciseType,
        },
        data: {
          totalAttempts: { increment: 1 },
          ...(answer.isCorrect
            ? {
                correctAttempts: { increment: 1 },
                lastCorrectAt: new Date(),
              }
            : {}),
        },
      });
    }
  }
}
