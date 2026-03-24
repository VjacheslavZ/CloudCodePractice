import { Controller, Get, Param, ParseEnumPipe, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ExerciseType } from '@cro/shared';

import { ContentService } from './content.service';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private contentService: ContentService) {}

  @Get('topics')
  @ApiOperation({ summary: 'List active exercise topics' })
  async getTopics() {
    return this.contentService.getActiveTopics();
  }

  @Get('topics/:id')
  @ApiOperation({ summary: 'Get exercise topic by ID' })
  async getTopic(@Param('id', ParseUUIDPipe) id: string) {
    return this.contentService.getTopicById(id);
  }

  @Get('topics/:topicId/items/:exerciseType')
  @ApiOperation({ summary: 'Get items for a topic by exercise type' })
  async getItems(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('exerciseType', new ParseEnumPipe(ExerciseType)) exerciseType: ExerciseType,
  ) {
    return this.contentService.getItemsForTopic(topicId, exerciseType);
  }
}
