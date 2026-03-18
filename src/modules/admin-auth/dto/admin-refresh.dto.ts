import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminRefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
