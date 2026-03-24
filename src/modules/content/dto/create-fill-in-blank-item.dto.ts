import { IsString, IsUUID, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFillInBlankItemDto {
  @ApiProperty()
  @IsUUID()
  topicId: string;

  @ApiProperty({ description: 'Sentence with {{BLANK}} placeholder' })
  @IsString()
  sentenceHr: string;

  @ApiProperty()
  @IsString()
  blankAnswer: string;

  @ApiProperty()
  @IsString()
  translationRu: string;

  @ApiProperty()
  @IsString()
  translationUk: string;

  @ApiProperty()
  @IsString()
  translationEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
