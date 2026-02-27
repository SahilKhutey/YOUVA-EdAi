import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class WebScraperService {
  private readonly logger = new Logger(WebScraperService.name);

  async extractMetadata(
    url: string,
  ): Promise<{ title: string; description: string }> {
    try {
      // Validate URL to prevent scraping non-whitelisted or malicious sites if needed,
      // but for now we rely on the caller validation.

      const html = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; EdAiBot/1.0; +http://edai.example.com)',
        },
        timeout: 5000, // 5s timeout to avoid hanging
      });

      const $ = cheerio.load(html.data);

      const title =
        $('title').text() ||
        $('meta[property="og:title"]').attr('content') ||
        '';
      const description =
        $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') ||
        '';

      return { title: title.trim(), description: description.trim() };
    } catch (error) {
      this.logger.warn(
        `Failed to scrape metadata for ${url}: ${error.message}`,
      );
      return { title: '', description: '' };
    }
  }
}
