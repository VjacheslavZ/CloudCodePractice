import { Module } from '@nestjs/common';

import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { ContentController } from './content.controller';
import { AdminContentController } from './admin-content.controller';
import { ContentService } from './content.service';
import { ContentCacheService } from './content-cache.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [ContentController, AdminContentController],
  providers: [ContentService, ContentCacheService],
  exports: [ContentService],
})
export class ContentModule {}
