import { Injectable } from '@nestjs/common';
import { startOfDay, subDays, isEqual } from 'date-fns';
import { XP_PER_CORRECT_ANSWER } from '@cro/shared/constants';

import { PrismaService } from '../../prisma/prisma.service';

export interface XpStreakResult {
  xpEarned: number;
  xpTotal: number;
  currentStreak: number;
  longestStreak: number;
}

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  async awardXpAndUpdateStreak(userId: string, correctAnswers: number): Promise<XpStreakResult> {
    const xpEarned = correctAnswers * XP_PER_CORRECT_ANSWER;
    const today = startOfDay(new Date());

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        xpTotal: true,
        currentStreak: true,
        longestStreak: true,
        lastPracticeDate: true,
      },
    });

    let newStreak: number;
    const yesterday = startOfDay(subDays(today, 1));

    if (!user.lastPracticeDate) {
      newStreak = 1;
    } else {
      const lastPractice = startOfDay(user.lastPracticeDate);
      if (isEqual(lastPractice, today)) {
        newStreak = user.currentStreak;
      } else if (isEqual(lastPractice, yesterday)) {
        newStreak = user.currentStreak + 1;
      } else {
        newStreak = 1;
      }
    }

    const newLongestStreak = Math.max(user.longestStreak, newStreak);
    const newXpTotal = user.xpTotal + xpEarned;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        xpTotal: newXpTotal,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastPracticeDate: today,
      },
    });

    await this.prisma.streakLog.upsert({
      where: { userId_date: { userId, date: today } },
      update: { xpEarned: { increment: xpEarned } },
      create: { userId, date: today, xpEarned },
    });

    return {
      xpEarned,
      xpTotal: newXpTotal,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
    };
  }
}
