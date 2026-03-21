import { Injectable } from '@nestjs/common';
import { ExerciseType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async initializeProgressForWordSet(
    userId: string,
    wordSetId: string,
    exerciseType: ExerciseType,
  ): Promise<void> {
    const words = await this.prisma.word.findMany({
      where: {
        wordSetId,
        exerciseConfigs: { some: { exerciseType } },
      },
      select: { id: true },
    });

    if (words.length === 0) return;

    await this.prisma.userWordProgress.createMany({
      data: words.map((word) => ({
        userId,
        wordId: word.id,
        exerciseType,
        seenInCurrentCycle: false,
        cycleNumber: 1,
      })),
      skipDuplicates: true,
    });
  }

  async getNextWords(
    userId: string,
    exerciseType: ExerciseType,
    wordSetId: string,
    count: number = 10,
  ): Promise<{
    words: {
      id: string;
      baseForm: string;
      pluralForm: string | null;
      translationRu: string;
      translationUk: string;
      translationEn: string;
    }[];
    cycleExhausted: boolean;
  }> {
    const unseenProgress = await this.prisma.userWordProgress.findMany({
      where: {
        userId,
        exerciseType,
        seenInCurrentCycle: false,
        word: { wordSetId },
      },
      include: {
        word: {
          select: {
            id: true,
            baseForm: true,
            pluralForm: true,
            translationRu: true,
            translationUk: true,
            translationEn: true,
            sortOrder: true,
          },
        },
      },
      orderBy: { word: { sortOrder: 'asc' } },
      take: count,
    });

    if (unseenProgress.length > 0) {
      return {
        words: unseenProgress.map((p) => p.word),
        cycleExhausted: false,
      };
    }

    // Check if there are any progress records at all (could be exhausted cycle)
    const totalProgress = await this.prisma.userWordProgress.count({
      where: {
        userId,
        exerciseType,
        word: { wordSetId },
      },
    });

    return {
      words: [],
      cycleExhausted: totalProgress > 0,
    };
  }

  async resetCycle(userId: string, exerciseType: ExerciseType, wordSetId: string): Promise<void> {
    const progressIds = await this.prisma.userWordProgress.findMany({
      where: {
        userId,
        exerciseType,
        word: { wordSetId },
      },
      select: { id: true },
    });

    if (progressIds.length === 0) return;

    await this.prisma.userWordProgress.updateMany({
      where: {
        id: { in: progressIds.map((p) => p.id) },
      },
      data: {
        seenInCurrentCycle: false,
        cycleNumber: { increment: 1 },
      },
    });
  }

  async markWordsSeen(
    userId: string,
    exerciseType: ExerciseType,
    wordIds: string[],
  ): Promise<void> {
    await this.prisma.userWordProgress.updateMany({
      where: {
        userId,
        exerciseType,
        wordId: { in: wordIds },
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
    answers: { wordId: string; isCorrect: boolean }[],
  ): Promise<void> {
    for (const answer of answers) {
      await this.prisma.userWordProgress.updateMany({
        where: {
          userId,
          wordId: answer.wordId,
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
