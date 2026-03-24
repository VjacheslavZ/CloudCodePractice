import { Module } from '@nestjs/common';

import { ContentModule } from '../content/content.module';
import { ProgressService } from './progress.service';

@Module({
  imports: [ContentModule],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
