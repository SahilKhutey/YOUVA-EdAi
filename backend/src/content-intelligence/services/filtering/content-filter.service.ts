import { Injectable } from '@nestjs/common';
import { Resource } from '../../interfaces/resource.interface';

@Injectable()
export class ContentFilterService {
  private readonly clickbaitKeywords = [
    'shocking',
    'you wont believe',
    'must watch',
    'omg',
    'gone wrong',
    'exposed',
  ];

  filterResources(resources: Resource[]): Resource[] {
    return resources.filter((r) => {
      // 1. Duration filter: Remove Shorts (< 3 mins)
      if (r.durationSeconds && r.durationSeconds < 180) return false;

      // 2. Clickbait filter
      if (this.isClickbait(r.title)) return false;

      // 3. Language filter (Assuming English for now, or check metadata)
      // Implementation depends on if we have language metadata.
      // specific youtube results usually come in the requested language.

      return true;
    });
  }

  isClickbait(title: string): boolean {
    const lowerTitle = title.toLowerCase();
    return this.clickbaitKeywords.some((keyword) =>
      lowerTitle.includes(keyword),
    );
  }
}
