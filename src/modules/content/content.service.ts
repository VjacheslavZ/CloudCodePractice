import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ExerciseType } from '@cro/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { ContentCacheService } from './content-cache.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateWordSetDto } from './dto/create-word-set.dto';
import { UpdateWordSetDto } from './dto/update-word-set.dto';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private cache: ContentCacheService,
  ) {}

  // --- Categories ---

  async getActiveCategories() {
    const cacheKey = 'content:categories';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    await this.cache.set(cacheKey, categories);
    return categories;
  }

  async getAllCategories() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getCategoryById(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async createCategory(dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({ data: dto });
    await this.cache.invalidate('content:categories');
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    await this.getCategoryById(id);
    const category = await this.prisma.category.update({
      where: { id },
      data: dto,
    });
    await this.cache.invalidate('content:categories');
    return category;
  }

  async deleteCategory(id: string) {
    await this.getCategoryById(id);
    const wordSetCount = await this.prisma.wordSet.count({
      where: { categoryId: id },
    });
    if (wordSetCount > 0) {
      throw new ConflictException('Remove all word sets first');
    }
    await this.prisma.category.delete({ where: { id } });
    await this.cache.invalidate('content:categories');
  }

  // --- Word Sets ---

  async getActiveWordSets(categoryId: string) {
    const cacheKey = `content:cat:${categoryId}:ws`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const wordSets = await this.prisma.wordSet.findMany({
      where: { categoryId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { words: true } } },
    });

    const result = wordSets.map(({ _count, ...ws }) => ({
      ...ws,
      wordCount: _count.words,
    }));

    await this.cache.set(cacheKey, result);
    return result;
  }

  async getAllWordSets(categoryId?: string) {
    const where = categoryId ? { categoryId } : {};
    const wordSets = await this.prisma.wordSet.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { words: true } } },
    });

    return wordSets.map(({ _count, ...ws }) => ({
      ...ws,
      wordCount: _count.words,
    }));
  }

  async getWordSetById(id: string) {
    const wordSet = await this.prisma.wordSet.findUnique({ where: { id } });
    if (!wordSet) throw new NotFoundException('Word set not found');
    return wordSet;
  }

  async createWordSet(dto: CreateWordSetDto) {
    await this.getCategoryById(dto.categoryId);
    const wordSet = await this.prisma.wordSet.create({ data: dto });
    await this.invalidateWordSetCache(dto.categoryId);
    return wordSet;
  }

  async updateWordSet(id: string, dto: UpdateWordSetDto) {
    const existing = await this.getWordSetById(id);
    const wordSet = await this.prisma.wordSet.update({
      where: { id },
      data: dto,
    });
    await this.invalidateWordSetCache(existing.categoryId);
    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      await this.invalidateWordSetCache(dto.categoryId);
    }
    return wordSet;
  }

  async deleteWordSet(id: string) {
    const existing = await this.getWordSetById(id);
    const wordCount = await this.prisma.word.count({
      where: { wordSetId: id },
    });
    if (wordCount > 0) {
      throw new ConflictException('Remove all words first');
    }
    await this.prisma.wordSet.delete({ where: { id } });
    await this.invalidateWordSetCache(existing.categoryId);
  }

  // --- Words ---

  async getWords(wordSetId: string) {
    const cacheKey = `content:ws:${wordSetId}:words`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const words = await this.prisma.word.findMany({
      where: { wordSetId },
      orderBy: { sortOrder: 'asc' },
      include: { exerciseConfigs: true },
    });

    await this.cache.set(cacheKey, words);
    return words;
  }

  async getAllWords(wordSetId?: string) {
    const where = wordSetId ? { wordSetId } : {};
    return this.prisma.word.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { exerciseConfigs: true },
    });
  }

  async getWordById(id: string) {
    const word = await this.prisma.word.findUnique({
      where: { id },
      include: { exerciseConfigs: true },
    });
    if (!word) throw new NotFoundException('Word not found');
    return word;
  }

  async createWord(dto: CreateWordDto) {
    await this.getWordSetById(dto.wordSetId);
    const word = await this.prisma.word.create({
      data: dto,
      include: { exerciseConfigs: true },
    });
    await this.invalidateWordsCache(dto.wordSetId);
    return word;
  }

  async updateWord(id: string, dto: UpdateWordDto) {
    const existing = await this.getWordById(id);
    const word = await this.prisma.word.update({
      where: { id },
      data: dto,
      include: { exerciseConfigs: true },
    });
    await this.invalidateWordsCache(existing.wordSetId);
    if (dto.wordSetId && dto.wordSetId !== existing.wordSetId) {
      await this.invalidateWordsCache(dto.wordSetId);
    }
    return word;
  }

  async deleteWord(id: string) {
    const existing = await this.getWordById(id);
    await this.prisma.word.delete({ where: { id } });
    await this.invalidateWordsCache(existing.wordSetId);
  }

  // --- Exercise Configs ---

  async updateExerciseConfigs(
    wordId: string,
    configs: { exerciseType: ExerciseType; enabled: boolean }[],
  ) {
    const word = await this.getWordById(wordId);

    for (const config of configs) {
      if (config.enabled) {
        await this.prisma.wordExerciseConfig.upsert({
          where: {
            wordId_exerciseType: { wordId, exerciseType: config.exerciseType },
          },
          update: {},
          create: { wordId, exerciseType: config.exerciseType },
        });
      } else {
        await this.prisma.wordExerciseConfig.deleteMany({
          where: { wordId, exerciseType: config.exerciseType },
        });
      }
    }

    await this.invalidateWordsCache(word.wordSetId);
    return this.getWordById(wordId);
  }

  async bulkUpdateExerciseConfigs(wordIds: string[], exerciseType: ExerciseType, enabled: boolean) {
    if (enabled) {
      await this.prisma.wordExerciseConfig.createMany({
        data: wordIds.map((wordId) => ({ wordId, exerciseType })),
        skipDuplicates: true,
      });
    } else {
      await this.prisma.wordExerciseConfig.deleteMany({
        where: { wordId: { in: wordIds }, exerciseType },
      });
    }

    await this.cache.invalidatePattern('content:ws:*:words');
  }

  // --- Cache Helpers ---

  private async invalidateWordSetCache(categoryId: string) {
    await this.cache.invalidate(`content:cat:${categoryId}:ws`);
  }

  private async invalidateWordsCache(wordSetId: string) {
    await this.cache.invalidate(`content:ws:${wordSetId}:words`);
  }
}
