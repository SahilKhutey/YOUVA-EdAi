import { Module, Global } from '@nestjs/common';
import { LkcCacheService } from './lkc-cache.service';

@Global()
@Module({
  providers: [LkcCacheService],
  exports: [LkcCacheService],
})
export class CacheModule {}
