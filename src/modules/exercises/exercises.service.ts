import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SessionStatus } from '@cro/shared';
import { ExerciseType } from '@prisma/client';
import { WORDS_PER_SESSION } from '@cro/shared/constants';

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

  async createSession(userId: string, wordSetId: string, exerciseType: ExerciseType) {
    await this.progressService.initializeProgressForWordSet(userId, wordSetId, exerciseType);

    const { words, cycleExhausted } = await this.progressService.getNextWords(
      userId,
      exerciseType,
      wordSetId,
      WORDS_PER_SESSION,
    );

    if (words.length === 0) {
      return { cycleExhausted, session: null };
    }

    const session = await this.prisma.exerciseSession.create({
      data: {
        userId,
        exerciseType,
        wordSetId,
        status: SessionStatus.IN_PROGRESS,
        totalQuestions: words.length,
      },
    });

    return {
      cycleExhausted: false,
      session: {
        id: session.id,
        exerciseType: session.exerciseType,
        wordSetId: session.wordSetId,
        status: session.status,
        totalQuestions: session.totalQuestions,
        words: words.map((w) => ({
          wordId: w.id,
          baseForm: w.baseForm,
          pluralForm: w.pluralForm,
          translationRu: w.translationRu,
          translationUk: w.translationUk,
          translationEn: w.translationEn,
        })),
      },
    };
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.exerciseSession.findUnique({
      where: { id: sessionId },
      include: {
        wordSet: {
          include: {
            words: {
              include: { exerciseConfigs: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();

    return session;
  }

  async finishSession(
    userId: string,
    sessionId: string,
    answers: { wordId: string; givenAnswer: string; isCorrect: boolean }[],
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
        wordId: a.wordId,
        givenAnswer: a.givenAnswer,
        isCorrect: a.isCorrect,
      })),
    });

    // Mark words as seen
    const wordIds = answers.map((a) => a.wordId);
    await this.progressService.markWordsSeen(userId, session.exerciseType, wordIds);

    // Record attempt stats
    await this.progressService.recordAttempts(
      userId,
      session.exerciseType,
      answers.map((a) => ({ wordId: a.wordId, isCorrect: a.isCorrect })),
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

  async resetCycle(userId: string, wordSetId: string, exerciseType: ExerciseType) {
    await this.progressService.resetCycle(userId, exerciseType, wordSetId);
    return { success: true };
  }
}
