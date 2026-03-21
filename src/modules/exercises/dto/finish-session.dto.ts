import { IsArray, IsBoolean, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SessionAnswerItem {
  @ApiProperty()
  @IsUUID()
  wordId: string;

  @ApiProperty()
  @IsString()
  givenAnswer: string;

  @ApiProperty()
  @IsBoolean()
  isCorrect: boolean;
}

export class FinishSessionDto {
  @ApiProperty({ type: [SessionAnswerItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionAnswerItem)
  answers: SessionAnswerItem[];
}
