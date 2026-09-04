import { Injectable, Logger } from '@nestjs/common';
import { YoutubeService } from './youtube/youtube.service';
import { GoogleSearchService } from './web-search/google-search.service';
import { WebScraperService } from './web-search/web-scraper.service';
import { ContentFilterService } from './filtering/content-filter.service';
import { ContentScoringService } from './scoring/content-scoring.service';
import { PersonalizationAdapterService } from './personalization/personalization-adapter.service';
import { RedisCacheService } from './cache/redis-cache.service';
import { ResourceRepositoryService } from './storage/resource-repository.service';
import { Resource } from '../interfaces/resource.interface';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private readonly youtubeService: YoutubeService,
    private readonly googleSearchService: GoogleSearchService,
    private readonly webScraperService: WebScraperService,
    private readonly filterService: ContentFilterService,
    private readonly scoringService: ContentScoringService,
    private readonly personalizationService: PersonalizationAdapterService,
    private readonly cacheService: RedisCacheService,
    private readonly repositoryService: ResourceRepositoryService,
  ) {}

  async searchContent(
    query: string,
    userId: string,
    topicId: string,
  ): Promise<Resource[]> {
    // 1. Check Redis Cache
    const cacheKey = `search:${query}:${topicId}`;
    const cachedResults = await this.cacheService.get<Resource[]>(cacheKey);
    if (cachedResults) {
      this.logger.log(`Cache hit for query: ${query}`);
      return cachedResults;
    }

    this.logger.log(`Cache miss for query: ${query}, fetching from APIs`);

    // 2. Fetch from APIs in parallel
    const [youtubeResults, webResults] = await Promise.all([
      this.youtubeService.searchVideos(query),
      this.googleSearchService.searchEducationalArticles(query),
    ]);

    let resources = [...youtubeResults, ...webResults];

    // 3. Filter
    resources = this.filterService.filterResources(resources);

    // 4. Score
    // Get raw scores first
    let scoredResources = this.scoringService.scoreResources(resources);

    // 5. Personalize
    const masteryLevel = await this.personalizationService.getMasteryLevel(
      userId,
      topicId,
    );
    if (masteryLevel) {
      scoredResources = scoredResources.map((r) => {
        const boost = this.personalizationService.calculatePersonalizationBoost(
          r,
          masteryLevel,
        );
        return { ...r, score: r.score * boost };
      });
    }

    // 6. Rank (Sort by final score)
    scoredResources.sort((a, b) => b.score - a.score);

    // Take top 10
    const topResults = scoredResources.slice(0, 10);

    // 7. Store top results
    // We do this asynchronously to not block response
    this.repositoryService
      .saveResources(topResults)
      .catch((err) =>
        this.logger.error(`Background save failed: ${err.message}`),
      );

    // 8. Cache (TTL 12h = 43200s)
    await this.cacheService.set(cacheKey, topResults, 43200);

    return topResults;
  }

  async trackEngagement(resourceId: string, type: string, userId: string) {
    // Simple implementation: increment view/like count in repo
    // In real world: emit event, process async
    await this.repositoryService.incrementEngagement(resourceId, type);
    return { success: true };
  }
}
