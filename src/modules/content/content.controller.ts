import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { ContentService } from './content.service';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private contentService: ContentService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List active categories' })
  async getCategories() {
    return this.contentService.getActiveCategories();
  }

  @Get('categories/:id/word-sets')
  @ApiOperation({ summary: 'List active word sets in a category' })
  async getWordSets(@Param('id', ParseUUIDPipe) id: string) {
    return this.contentService.getActiveWordSets(id);
  }

  @Get('word-sets/:id/words')
  @ApiOperation({ summary: 'List words in a word set' })
  async getWords(@Param('id', ParseUUIDPipe) id: string) {
    return this.contentService.getWords(id);
  }
}
