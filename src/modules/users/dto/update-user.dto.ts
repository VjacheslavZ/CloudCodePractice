import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NativeLanguage } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: NativeLanguage })
  @IsOptional()
  @IsEnum(NativeLanguage)
  nativeLanguage?: NativeLanguage;
}
