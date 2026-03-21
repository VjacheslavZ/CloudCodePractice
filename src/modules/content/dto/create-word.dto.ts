import { IsString, IsNotEmpty, IsInt, Min, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWordDto {
  @ApiProperty()
  @IsUUID()
  wordSetId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  baseForm: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pluralForm?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  translationRu: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  translationUk: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  translationEn: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sentenceHr?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sentenceBlankAnswer?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsString({ each: true })
  @IsOptional()
  wrongOptions?: string[];

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
