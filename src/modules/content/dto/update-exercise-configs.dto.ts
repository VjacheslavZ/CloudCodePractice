import { IsArray, IsBoolean, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ExerciseType } from '@cro/shared';

class ExerciseConfigItem {
  @ApiProperty({ enum: ExerciseType })
  @IsEnum(ExerciseType)
  exerciseType: ExerciseType;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}

export class UpdateExerciseConfigsDto {
  @ApiProperty({ type: [ExerciseConfigItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseConfigItem)
  configs: ExerciseConfigItem[];
}
