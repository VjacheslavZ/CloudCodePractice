import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({ example: 'test@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'zxcv1234' })
  @IsString()
  @MinLength(8)
  password: string;
}
