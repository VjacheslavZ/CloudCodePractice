import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExerciseType } from '@cro/shared';

export class ResetCycleDto {
  @ApiProperty()
  @IsUUID()
  wordSetId: string;

  @ApiProperty({ enum: ExerciseType })
  @IsEnum(ExerciseType)
  exerciseType: ExerciseType;
}
