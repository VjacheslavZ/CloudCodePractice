import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SessionStatus } from '@cro/shared';
import { ExerciseType } from '@cro/shared';
import { ITEMS_PER_SESSION } from '@cro/shared/constants';

import { PrismaService } from '../../prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class ExercisesService {
  constructor(
    private prisma: PrismaService,
    private progressService: ProgressService,
    private gamificationService: GamificationService,
  ) {}

  async createSession(userId: string, topicId: string, exerciseType: ExerciseType) {
    await this.progressService.initializeProgressForTopic(userId, topicId, exerciseType);

    const { items, cycleExhausted } = await this.progressService.getNextItems(
      userId,
      exerciseType,
      topicId,
      ITEMS_PER_SESSION,
    );

    if (items.length === 0) {
      return { cycleExhausted, session: null };
    }

    const session = await this.prisma.exerciseSession.create({
      data: {
        userId,
        exerciseType,
        topicId,
        status: SessionStatus.IN_PROGRESS,
        totalQuestions: items.length,
      },
    });

    return {
      cycleExhausted: false,
      session: {
        id: session.id,
        exerciseType: session.exerciseType,
        topicId: session.topicId,
        status: session.status,
        totalQuestions: session.totalQuestions,
        items: items.map((item: Record<string, unknown>) => ({
          type: exerciseType,
          ...item,
        })),
      },
    };
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.exerciseSession.findUnique({
      where: { id: sessionId },
      include: { topic: true },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();

    return session;
  }

  async finishSession(
    userId: string,
    sessionId: string,
    answers: { itemId: string; givenAnswer: string; isCorrect: boolean }[],
  ) {
    const session = await this.prisma.exerciseSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();
    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new ForbiddenException('Session already completed');
    }

    const correctAnswers = answers.filter((a) => a.isCorrect).length;

    // Save answers
    await this.prisma.sessionAnswer.createMany({
      data: answers.map((a) => ({
        sessionId,
        itemId: a.itemId,
        givenAnswer: a.givenAnswer,
        isCorrect: a.isCorrect,
      })),
    });

    // Mark items as seen
    const itemIds = answers.map((a) => a.itemId);
    const exerciseType = session.exerciseType as ExerciseType;
    await this.progressService.markItemsSeen(userId, exerciseType, itemIds);

    // Record attempt stats
    await this.progressService.recordAttempts(
      userId,
      exerciseType,
      answers.map((a) => ({ itemId: a.itemId, isCorrect: a.isCorrect })),
    );

    // Award XP and update streak
    const gamification = await this.gamificationService.awardXpAndUpdateStreak(
      userId,
      correctAnswers,
    );

    // Update session
    await this.prisma.exerciseSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        correctAnswers,
        xpEarned: gamification.xpEarned,
        completedAt: new Date(),
      },
    });

    return {
      sessionId,
      correctAnswers,
      totalQuestions: session.totalQuestions,
      xpEarned: gamification.xpEarned,
      newXpTotal: gamification.xpTotal,
      currentStreak: gamification.currentStreak,
      longestStreak: gamification.longestStreak,
    };
  }

  async resetCycle(userId: string, topicId: string, exerciseType: ExerciseType) {
    await this.progressService.resetCycle(userId, exerciseType, topicId);
    return { success: true };
  }
}
