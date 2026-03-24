import { PartialType, OmitType } from '@nestjs/swagger';

import { CreateSingularPluralItemDto } from './create-singular-plural-item.dto';

export class UpdateSingularPluralItemDto extends PartialType(
  OmitType(CreateSingularPluralItemDto, ['topicId']),
) {}
