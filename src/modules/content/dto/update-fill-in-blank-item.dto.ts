import { PartialType, OmitType } from '@nestjs/swagger';

import { CreateFillInBlankItemDto } from './create-fill-in-blank-item.dto';

export class UpdateFillInBlankItemDto extends PartialType(
  OmitType(CreateFillInBlankItemDto, ['topicId']),
) {}
