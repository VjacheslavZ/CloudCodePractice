import { IsString, IsUUID, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSingularPluralItemDto {
  @ApiProperty()
  @IsUUID()
  topicId: string;

  @ApiProperty()
  @IsString()
  baseForm: string;

  @ApiProperty()
  @IsString()
  pluralForm: string;

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
