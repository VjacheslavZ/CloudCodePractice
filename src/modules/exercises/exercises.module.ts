import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ProgressModule } from '../progress/progress.module';
import { GamificationModule } from '../gamification/gamification.module';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';

@Module({
  imports: [AuthModule, ProgressModule, GamificationModule],
  controllers: [ExercisesController],
  providers: [ExercisesService],
})
export class ExercisesModule {}
