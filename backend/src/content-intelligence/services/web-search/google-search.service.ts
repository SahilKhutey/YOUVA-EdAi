import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Resource } from '../../interfaces/resource.interface';

@Injectable()
export class GoogleSearchService {
  private readonly logger = new Logger(GoogleSearchService.name);
  private readonly apiKey: string;
  private readonly cx: string;
  private readonly baseUrl = 'https://www.googleapis.com/customsearch/v1';

  // Whitelist domains as per instructions
  private readonly whitelistDomains = [
    '.edu',
    'openstax.org',
    'khanacademy.org',
    'mit.edu',
  ];

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_API_KEY') || '';
    this.cx = this.configService.get<string>('GOOGLE_SEARCH_CX') || ''; // Custom Search Engine ID

    if (!this.apiKey) this.logger.warn('GOOGLE_API_KEY is not set');
    if (!this.cx) this.logger.warn('GOOGLE_SEARCH_CX is not set');
  }

  async searchEducationalArticles(query: string): Promise<Resource[]> {
    if (!this.apiKey || !this.cx) {
      this.logger.error('Cannot search web: API key or CX missing');
      return [];
    }

    try {
      const refinedQuery = this.buildQuery(query);
      const response = await this.callGoogleAPI(refinedQuery);

      if (!response.items) return [];

      return response.items.map((item: any) => ({
        title: item.title,
        description: item.snippet,
        url: item.link,
        source: 'web',
      }));
    } catch (error) {
      this.logger.error(
        `Error searching Google: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  private buildQuery(originalQuery: string): string {
    // Construct a query that targets the whitelist domains
    // Example: "calculus (site:.edu OR site:openstax.org OR ...)"
    const siteFilters = this.whitelistDomains
      .map((d) => `site:${d}`)
      .join(' OR ');
    return `${originalQuery} (${siteFilters})`;
  }

  private async callGoogleAPI(query: string) {
    const params = {
      key: this.apiKey,
      cx: this.cx,
      q: query,
    };
    const response = await axios.get(this.baseUrl, { params });
    return response.data;
  }
}
