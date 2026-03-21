import { PartialType } from '@nestjs/swagger';

import { CreateWordSetDto } from './create-word-set.dto';

export class UpdateWordSetDto extends PartialType(CreateWordSetDto) {}
