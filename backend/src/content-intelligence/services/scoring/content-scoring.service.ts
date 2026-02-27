import { Injectable } from '@nestjs/common';
import { Resource } from '../../interfaces/resource.interface';

@Injectable()
export class ContentScoringService {
  scoreResources(resources: Resource[]): (Resource & { score: number })[] {
    return resources
      .map((resource) => ({
        ...resource,
        score: this.calculateScore(resource),
      }))
      .sort((a, b) => b.score - a.score);
  }

  private calculateScore(resource: Resource): number {
    const views = resource.viewCount || 0;
    const duration = resource.durationSeconds || 0;
    const publishedAt = resource.publishedAt
      ? new Date(resource.publishedAt).getTime()
      : Date.now();

    // 1. Log(views) to normalize popularity
    // Avoid log(0)
    const viewScore = Math.log10(views + 1);

    // 2. Duration Quality (preference for 5-20 mins)
    // 300s = 5m, 1200s = 20m
    const durationScore = this.calculateDurationScore(duration);

    // 3. Recency (Newer is better, but not strictly)
    const recencyScore = this.calculateRecencyScore(publishedAt);

    // 4. Historical Engagement (Mocked as 0 for external resources initially)
    const historicalEngagement = 0;

    // Formula: 0.4 * log(views) + 0.2 * durationScore + 0.2 * recencyScore + 0.2 * historicalEngagement
    // Note: We need to normalize viewScore to be somewhat comparable to 0-1 or 0-100 scale.
    // YouTube views can be millions (log10(1M) = 6).
    // Let's assume max score around 10.

    const score =
      0.4 * viewScore +
      0.2 * durationScore +
      0.2 * recencyScore +
      0.2 * historicalEngagement;

    return parseFloat(score.toFixed(2));
  }

  private calculateDurationScore(seconds: number): number {
    if (seconds < 180) return 0; // Filtered out anyway usually
    if (seconds >= 300 && seconds <= 1200) return 10; // Sweet spot
    if (seconds > 1200) return 8; // Good but long
    return 5; // Acceptable
  }

  private calculateRecencyScore(publishedAtMs: number): number {
    const now = Date.now();
    const daysOld = (now - publishedAtMs) / (1000 * 60 * 60 * 24);

    if (daysOld < 30) return 10; // Fresh
    if (daysOld < 365) return 8; // < 1 year
    if (daysOld < 365 * 2) return 5; // < 2 years
    return 2; // Old
  }
}
