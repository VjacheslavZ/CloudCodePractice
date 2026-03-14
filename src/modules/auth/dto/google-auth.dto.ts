import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google OAuth2 ID token or authorization code' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
