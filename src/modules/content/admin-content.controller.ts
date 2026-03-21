import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { AdminGuard } from '../admin-auth/guards/admin.guard';
import { ContentService } from './content.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateWordSetDto } from './dto/create-word-set.dto';
import { UpdateWordSetDto } from './dto/update-word-set.dto';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { UpdateExerciseConfigsDto } from './dto/update-exercise-configs.dto';
import { BulkExerciseConfigsDto } from './dto/bulk-exercise-configs.dto';

@ApiTags('Admin Content')
@Controller('admin')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminContentController {
  constructor(private contentService: ContentService) {}

  // --- Categories ---

  @Get('categories')
  @ApiOperation({ summary: 'List all categories (including inactive)' })
  async getAllCategories() {
    return this.contentService.getAllCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a category' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.contentService.createCategory(dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  async updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.contentService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category' })
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    await this.contentService.deleteCategory(id);
  }

  // --- Word Sets ---

  @Get('word-sets')
  @ApiOperation({ summary: 'List all word sets (optionally filter by category)' })
  async getAllWordSets(@Query('categoryId') categoryId?: string) {
    return this.contentService.getAllWordSets(categoryId);
  }

  @Post('word-sets')
  @ApiOperation({ summary: 'Create a word set' })
  async createWordSet(@Body() dto: CreateWordSetDto) {
    return this.contentService.createWordSet(dto);
  }

  @Patch('word-sets/:id')
  @ApiOperation({ summary: 'Update a word set' })
  async updateWordSet(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWordSetDto) {
    return this.contentService.updateWordSet(id, dto);
  }

  @Delete('word-sets/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a word set' })
  async deleteWordSet(@Param('id', ParseUUIDPipe) id: string) {
    await this.contentService.deleteWordSet(id);
  }

  // --- Words ---

  @Get('words')
  @ApiOperation({ summary: 'List all words (optionally filter by word set)' })
  async getAllWords(@Query('wordSetId') wordSetId?: string) {
    return this.contentService.getAllWords(wordSetId);
  }

  @Post('words')
  @ApiOperation({ summary: 'Create a word' })
  async createWord(@Body() dto: CreateWordDto) {
    return this.contentService.createWord(dto);
  }

  @Patch('words/:id')
  @ApiOperation({ summary: 'Update a word' })
  async updateWord(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWordDto) {
    return this.contentService.updateWord(id, dto);
  }

  @Delete('words/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a word' })
  async deleteWord(@Param('id', ParseUUIDPipe) id: string) {
    await this.contentService.deleteWord(id);
  }

  @Patch('words/:id/exercise-configs')
  @ApiOperation({ summary: 'Update exercise type configs for a word' })
  async updateExerciseConfigs(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExerciseConfigsDto,
  ) {
    return this.contentService.updateExerciseConfigs(id, dto.configs);
  }

  @Post('words/bulk-exercise-configs')
  @ApiOperation({ summary: 'Bulk update exercise configs for multiple words' })
  async bulkExerciseConfigs(@Body() dto: BulkExerciseConfigsDto) {
    await this.contentService.bulkUpdateExerciseConfigs(dto.wordIds, dto.exerciseType, dto.enabled);
    return { success: true };
  }
}
