import { IsString, IsNotEmpty, IsInt, Min, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWordSetDto {
  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameHr: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameRu: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameUk: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
