import { IsArray, IsBoolean, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExerciseType } from '@cro/shared';

export class BulkExerciseConfigsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  wordIds: string[];

  @ApiProperty({ enum: ExerciseType })
  @IsEnum(ExerciseType)
  exerciseType: ExerciseType;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}
