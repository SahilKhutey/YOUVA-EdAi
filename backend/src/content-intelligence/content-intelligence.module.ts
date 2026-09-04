import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentSearchController } from './controllers/content-search.controller';
import { OrchestratorService } from './services/orchestrator.service';
import { YoutubeService } from './services/youtube/youtube.service';
import { GoogleSearchService } from './services/web-search/google-search.service';
import { WebScraperService } from './services/web-search/web-scraper.service';
import { ContentFilterService } from './services/filtering/content-filter.service';
import { ContentScoringService } from './services/scoring/content-scoring.service';
import { PersonalizationAdapterService } from './services/personalization/personalization-adapter.service';
import { RedisCacheService } from './services/cache/redis-cache.service';
import { ResourceRepositoryService } from './services/storage/resource-repository.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [ContentSearchController],
  providers: [
    OrchestratorService,
    YoutubeService,
    GoogleSearchService,
    WebScraperService,
    ContentFilterService,
    ContentScoringService,
    PersonalizationAdapterService,
    RedisCacheService,
    ResourceRepositoryService,
  ],
  exports: [OrchestratorService],
})
export class ContentIntelligenceModule {}
