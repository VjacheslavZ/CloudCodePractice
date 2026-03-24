import { IsArray, IsBoolean, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ExerciseType } from '@cro/shared';

class TopicTypeConfig {
  @ApiProperty({ enum: ExerciseType })
  @IsEnum(ExerciseType)
  exerciseType: ExerciseType;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}

export class UpdateTopicTypesDto {
  @ApiProperty({ type: [TopicTypeConfig] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicTypeConfig)
  configs: TopicTypeConfig[];
}
