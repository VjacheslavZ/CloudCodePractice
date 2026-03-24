import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ExerciseType } from '@cro/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { ContentCacheService } from './content-cache.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { CreateSingularPluralItemDto } from './dto/create-singular-plural-item.dto';
import { UpdateSingularPluralItemDto } from './dto/update-singular-plural-item.dto';
import { CreateFlashcardItemDto } from './dto/create-flashcard-item.dto';
import { UpdateFlashcardItemDto } from './dto/update-flashcard-item.dto';
import { CreateFillInBlankItemDto } from './dto/create-fill-in-blank-item.dto';
import { UpdateFillInBlankItemDto } from './dto/update-fill-in-blank-item.dto';

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private cache: ContentCacheService,
  ) {}

  // --- Topics ---

  async getActiveTopics() {
    const cacheKey = 'content:topics';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const topics = await this.prisma.exerciseTopic.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { topicTypes: true },
    });

    const result = topics.map(({ topicTypes, ...topic }) => ({
      ...topic,
      exerciseTypes: topicTypes.map((tt) => tt.exerciseType),
    }));

    await this.cache.set(cacheKey, result);
    return result;
  }

  async getAllTopics() {
    const topics = await this.prisma.exerciseTopic.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { topicTypes: true },
    });

    return topics.map(({ topicTypes, ...topic }) => ({
      ...topic,
      exerciseTypes: topicTypes.map((tt) => tt.exerciseType),
    }));
  }

  async getTopicById(id: string) {
    const topic = await this.prisma.exerciseTopic.findUnique({
      where: { id },
      include: { topicTypes: true },
    });
    if (!topic) throw new NotFoundException('Topic not found');
    const { topicTypes, ...rest } = topic;
    return {
      ...rest,
      exerciseTypes: topicTypes.map((tt) => tt.exerciseType),
    };
  }

  async createTopic(dto: CreateTopicDto) {
    const topic = await this.prisma.exerciseTopic.create({ data: dto });
    await this.cache.invalidate('content:topics');
    return { ...topic, exerciseTypes: [] };
  }

  async updateTopic(id: string, dto: UpdateTopicDto) {
    await this.getTopicById(id);
    const topic = await this.prisma.exerciseTopic.update({
      where: { id },
      data: dto,
      include: { topicTypes: true },
    });
    await this.cache.invalidate('content:topics');
    const { topicTypes, ...rest } = topic;
    return { ...rest, exerciseTypes: topicTypes.map((tt) => tt.exerciseType) };
  }

  async deleteTopic(id: string) {
    await this.getTopicById(id);
    const itemCount = await this.countTopicItems(id);
    if (itemCount > 0) {
      throw new ConflictException('Remove all items first');
    }
    await this.prisma.exerciseTopic.delete({ where: { id } });
    await this.cache.invalidate('content:topics');
  }

  // --- Topic Types ---

  async updateTopicTypes(
    topicId: string,
    configs: { exerciseType: ExerciseType; enabled: boolean }[],
  ) {
    await this.getTopicById(topicId);

    for (const config of configs) {
      if (config.enabled) {
        await this.prisma.exerciseTopicType.upsert({
          where: {
            topicId_exerciseType: { topicId, exerciseType: config.exerciseType },
          },
          update: {},
          create: { topicId, exerciseType: config.exerciseType },
        });
      } else {
        await this.prisma.exerciseTopicType.deleteMany({
          where: { topicId, exerciseType: config.exerciseType },
        });
      }
    }

    await this.cache.invalidate('content:topics');
    return this.getTopicById(topicId);
  }

  // --- Singular Plural Items ---
  async getSingularPluralItems(topicId: string) {
    return this.prisma.singularPluralItem.findMany({
      where: { topicId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createSingularPluralItem(dto: CreateSingularPluralItemDto) {
    await this.getTopicById(dto.topicId);
    const duplicate = await this.prisma.singularPluralItem.findUnique({
      where: { baseForm: dto.baseForm },
    });
    if (duplicate) {
      throw new ConflictException('Item with this baseForm already exists');
    }
    const item = await this.prisma.singularPluralItem.create({ data: dto });
    await this.invalidateItemsCache(dto.topicId, ExerciseType.TYPE_THE_ANSWER);
    return item;
  }

  async updateSingularPluralItem(id: string, dto: UpdateSingularPluralItemDto) {
    const existing = await this.prisma.singularPluralItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Singular plural item not found');
    if (dto.baseForm && dto.baseForm !== existing.baseForm) {
      const duplicate = await this.prisma.singularPluralItem.findUnique({
        where: { baseForm: dto.baseForm },
      });
      if (duplicate) {
        throw new ConflictException('Item with this baseForm already exists');
      }
    }
    const item = await this.prisma.singularPluralItem.update({ where: { id }, data: dto });
    await this.invalidateItemsCache(existing.topicId, ExerciseType.TYPE_THE_ANSWER);
    return item;
  }

  async deleteSingularPluralItem(id: string) {
    const existing = await this.prisma.singularPluralItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Singular plural item not found');
    await this.prisma.singularPluralItem.delete({ where: { id } });
    await this.invalidateItemsCache(existing.topicId, ExerciseType.TYPE_THE_ANSWER);
  }

  // --- Flashcard Items ---
  async getFlashcardItems(topicId: string) {
    return this.prisma.flashcardItem.findMany({
      where: { topicId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createFlashcardItem(dto: CreateFlashcardItemDto) {
    await this.getTopicById(dto.topicId);
    const item = await this.prisma.flashcardItem.create({ data: dto });
    await this.invalidateItemsCache(dto.topicId, ExerciseType.FLASHCARDS);
    return item;
  }

  async updateFlashcardItem(id: string, dto: UpdateFlashcardItemDto) {
    const existing = await this.prisma.flashcardItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Flashcard item not found');
    const item = await this.prisma.flashcardItem.update({ where: { id }, data: dto });
    await this.invalidateItemsCache(existing.topicId, ExerciseType.FLASHCARDS);
    return item;
  }

  async deleteFlashcardItem(id: string) {
    const existing = await this.prisma.flashcardItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Flashcard item not found');
    await this.prisma.flashcardItem.delete({ where: { id } });
    await this.invalidateItemsCache(existing.topicId, ExerciseType.FLASHCARDS);
  }

  // --- Fill In Blank Items ---
  async getFillInBlankItems(topicId: string) {
    return this.prisma.fillInBlankItem.findMany({
      where: { topicId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createFillInBlankItem(dto: CreateFillInBlankItemDto) {
    await this.getTopicById(dto.topicId);
    const item = await this.prisma.fillInBlankItem.create({ data: dto });
    await this.invalidateItemsCache(dto.topicId, ExerciseType.FILL_IN_BLANK);
    return item;
  }

  async updateFillInBlankItem(id: string, dto: UpdateFillInBlankItemDto) {
    const existing = await this.prisma.fillInBlankItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Fill in blank item not found');
    const item = await this.prisma.fillInBlankItem.update({ where: { id }, data: dto });
    await this.invalidateItemsCache(existing.topicId, ExerciseType.FILL_IN_BLANK);
    return item;
  }

  async deleteFillInBlankItem(id: string) {
    const existing = await this.prisma.fillInBlankItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Fill in blank item not found');
    await this.prisma.fillInBlankItem.delete({ where: { id } });
    await this.invalidateItemsCache(existing.topicId, ExerciseType.FILL_IN_BLANK);
  }

  // --- Generic Item Access (used by exercises/progress modules) ---

  async getItemsForTopic(
    topicId: string,
    exerciseType: ExerciseType,
  ): Promise<Record<string, unknown>[]> {
    const cacheKey = `content:topic:${topicId}:items:${exerciseType}`;
    const cached = await this.cache.get<Record<string, unknown>[]>(cacheKey);
    if (cached) return cached;

    const items = await this.queryItemsByType(topicId, exerciseType);
    await this.cache.set(cacheKey, items);

    return items;
  }

  async getItemsByIds(
    exerciseType: ExerciseType,
    itemIds: string[],
  ): Promise<Record<string, unknown>[]> {
    if (itemIds.length === 0) return [];

    switch (exerciseType) {
      case ExerciseType.TYPE_THE_ANSWER:
        return this.prisma.singularPluralItem.findMany({
          where: { id: { in: itemIds } },
          orderBy: { sortOrder: 'asc' },
        });
      case ExerciseType.FLASHCARDS:
        return this.prisma.flashcardItem.findMany({
          where: { id: { in: itemIds } },
          orderBy: { sortOrder: 'asc' },
        });
      case ExerciseType.FILL_IN_BLANK:
        return this.prisma.fillInBlankItem.findMany({
          where: { id: { in: itemIds } },
          orderBy: { sortOrder: 'asc' },
        });
    }
  }

  // --- Private Helpers ---

  private async queryItemsByType(topicId: string, exerciseType: ExerciseType) {
    switch (exerciseType) {
      case ExerciseType.TYPE_THE_ANSWER:
        return this.prisma.singularPluralItem.findMany({
          where: { topicId },
          orderBy: { sortOrder: 'asc' },
        });
      case ExerciseType.FLASHCARDS:
        return this.prisma.flashcardItem.findMany({
          where: { topicId },
          orderBy: { sortOrder: 'asc' },
        });
      case ExerciseType.FILL_IN_BLANK:
        return this.prisma.fillInBlankItem.findMany({
          where: { topicId },
          orderBy: { sortOrder: 'asc' },
        });
    }
  }

  private async countTopicItems(topicId: string): Promise<number> {
    const [sp, fc, fib] = await Promise.all([
      this.prisma.singularPluralItem.count({ where: { topicId } }),
      this.prisma.flashcardItem.count({ where: { topicId } }),
      this.prisma.fillInBlankItem.count({ where: { topicId } }),
    ]);
    return sp + fc + fib;
  }

  private async invalidateItemsCache(topicId: string, exerciseType: ExerciseType) {
    await this.cache.invalidate(`content:topic:${topicId}:items:${exerciseType}`);
  }
}
