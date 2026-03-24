import { IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTopicDto {
  @ApiProperty()
  @IsString()
  nameHr: string;

  @ApiProperty()
  @IsString()
  nameRu: string;

  @ApiProperty()
  @IsString()
  nameUk: string;

  @ApiProperty()
  @IsString()
  nameEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
