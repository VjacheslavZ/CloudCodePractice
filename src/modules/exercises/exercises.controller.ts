import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { ExercisesService } from './exercises.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { FinishSessionDto } from './dto/finish-session.dto';
import { ResetCycleDto } from './dto/reset-cycle.dto';

@ApiTags('Exercises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exercises')
export class ExercisesController {
  constructor(private exercisesService: ExercisesService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create an exercise session' })
  async createSession(@CurrentUser() user: UserPayload, @Body() dto: CreateSessionDto) {
    return this.exercisesService.createSession(user.id, dto.wordSetId, dto.exerciseType);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session data' })
  async getSession(@CurrentUser() user: UserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.exercisesService.getSession(user.id, id);
  }

  @Post('sessions/:id/finish')
  @ApiOperation({ summary: 'Finish session and submit results' })
  async finishSession(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FinishSessionDto,
  ) {
    return this.exercisesService.finishSession(user.id, id, dto.answers);
  }

  @Post('cycle-reset')
  @ApiOperation({ summary: 'Reset word cycle for a word set' })
  async resetCycle(@CurrentUser() user: UserPayload, @Body() dto: ResetCycleDto) {
    return this.exercisesService.resetCycle(user.id, dto.wordSetId, dto.exerciseType);
  }
}
