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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { AdminGuard } from '../admin-auth/guards/admin.guard';
import { ContentService } from './content.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { UpdateTopicTypesDto } from './dto/update-topic-types.dto';
import { CreateSingularPluralItemDto } from './dto/create-singular-plural-item.dto';
import { UpdateSingularPluralItemDto } from './dto/update-singular-plural-item.dto';
import { CreateFlashcardItemDto } from './dto/create-flashcard-item.dto';
import { UpdateFlashcardItemDto } from './dto/update-flashcard-item.dto';
import { CreateFillInBlankItemDto } from './dto/create-fill-in-blank-item.dto';
import { UpdateFillInBlankItemDto } from './dto/update-fill-in-blank-item.dto';

@ApiTags('Admin Content')
@Controller('admin')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminContentController {
  constructor(private contentService: ContentService) {}

  // --- Topics ---

  @Get('topics')
  @ApiOperation({ summary: 'List all topics (including inactive)' })
  async getAllTopics() {
    return this.contentService.getAllTopics();
  }

  @Post('topics')
  @ApiOperation({ summary: 'Create a topic' })
  async createTopic(@Body() dto: CreateTopicDto) {
    return this.contentService.createTopic(dto);
  }

  @Patch('topics/:id')
  @ApiOperation({ summary: 'Update a topic' })
  async updateTopic(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTopicDto) {
    return this.contentService.updateTopic(id, dto);
  }

  @Delete('topics/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a topic' })
  async deleteTopic(@Param('id', ParseUUIDPipe) id: string) {
    await this.contentService.deleteTopic(id);
  }

  @Patch('topics/:id/exercise-types')
  @ApiOperation({ summary: 'Update exercise types enabled for a topic' })
  async updateTopicTypes(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTopicTypesDto) {
    return this.contentService.updateTopicTypes(id, dto.configs);
  }

  // --- Singular Plural Items ---

  @Get('topics/:topicId/singular-plural-items')
  @ApiOperation({ summary: 'List singular/plural items for a topic' })
  async getSingularPluralItems(@Param('topicId', ParseUUIDPipe) topicId: string) {
    return this.contentService.getSingularPluralItems(topicId);
  }

  @Post('singular-plural-items')
  @ApiOperation({ summary: 'Create a singular/plural item' })
  async createSingularPluralItem(@Body() dto: CreateSingularPluralItemDto) {
    return this.contentService.createSingularPluralItem(dto);
  }

  @Patch('singular-plural-items/:id')
  @ApiOperation({ summary: 'Update a singular/plural item' })
  async updateSingularPluralItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSingularPluralItemDto,
  ) {
    return this.contentService.updateSingularPluralItem(id, dto);
  }

  @Delete('singular-plural-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a singular/plural item' })
  async deleteSingularPluralItem(@Param('id', ParseUUIDPipe) id: string) {
    await this.contentService.deleteSingularPluralItem(id);
  }

  // --- Flashcard Items ---

  @Get('topics/:topicId/flashcard-items')
  @ApiOperation({ summary: 'List flashcard items for a topic' })
  async getFlashcardItems(@Param('topicId', ParseUUIDPipe) topicId: string) {
    return this.contentService.getFlashcardItems(topicId);
  }

  @Post('flashcard-items')
  @ApiOperation({ summary: 'Create a flashcard item' })
  async createFlashcardItem(@Body() dto: CreateFlashcardItemDto) {
    return this.contentService.createFlashcardItem(dto);
  }

  @Patch('flashcard-items/:id')
  @ApiOperation({ summary: 'Update a flashcard item' })
  async updateFlashcardItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFlashcardItemDto,
  ) {
    return this.contentService.updateFlashcardItem(id, dto);
  }

  @Delete('flashcard-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a flashcard item' })
  async deleteFlashcardItem(@Param('id', ParseUUIDPipe) id: string) {
    await this.contentService.deleteFlashcardItem(id);
  }

  // --- Fill In Blank Items ---

  @Get('topics/:topicId/fill-in-blank-items')
  @ApiOperation({ summary: 'List fill-in-blank items for a topic' })
  async getFillInBlankItems(@Param('topicId', ParseUUIDPipe) topicId: string) {
    return this.contentService.getFillInBlankItems(topicId);
  }

  @Post('fill-in-blank-items')
  @ApiOperation({ summary: 'Create a fill-in-blank item' })
  async createFillInBlankItem(@Body() dto: CreateFillInBlankItemDto) {
    return this.contentService.createFillInBlankItem(dto);
  }

  @Patch('fill-in-blank-items/:id')
  @ApiOperation({ summary: 'Update a fill-in-blank item' })
  async updateFillInBlankItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFillInBlankItemDto,
  ) {
    return this.contentService.updateFillInBlankItem(id, dto);
  }

  @Delete('fill-in-blank-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a fill-in-blank item' })
  async deleteFillInBlankItem(@Param('id', ParseUUIDPipe) id: string) {
    await this.contentService.deleteFillInBlankItem(id);
  }
}
