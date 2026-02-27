import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Resource } from '../../interfaces/resource.interface';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('YOUTUBE_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('YOUTUBE_API_KEY is not set');
    }
  }

  async searchVideos(query: string): Promise<Resource[]> {
    if (!this.apiKey) {
      this.logger.error('Cannot search videos: API key missing');
      return [];
    }

    try {
      const searchResults = await this.callSearchAPI(query);
      if (!searchResults || searchResults.length === 0) {
        return [];
      }

      const videoIds = searchResults.map((v: any) => v.id.videoId);
      const details = await this.callDetailsAPI(videoIds);

      return this.mapToResourceModel(searchResults, details);
    } catch (error) {
      this.logger.error(
        `Error searching YouTube videos: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  private async callSearchAPI(query: string) {
    const params = {
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: 10,
      key: this.apiKey,
      // relevanceLanguage: 'en', // Optional: filter by language if needed
    };

    const response = await axios.get(`${this.baseUrl}/search`, { params });
    return response.data.items || [];
  }

  private async callDetailsAPI(videoIds: string[]) {
    if (videoIds.length === 0) return [];

    const params = {
      part: 'contentDetails,statistics,snippet',
      id: videoIds.join(','),
      key: this.apiKey,
    };

    const response = await axios.get(`${this.baseUrl}/videos`, { params });
    return response.data.items || [];
  }

  private mapToResourceModel(searchResults: any[], details: any[]): Resource[] {
    // Create a map of details by ID for easy lookup
    const detailsMap = new Map(details.map((d) => [d.id, d]));

    return searchResults.map((searchResult) => {
      const videoId = searchResult.id.videoId;
      const detail = detailsMap.get(videoId);

      // Basic info from search result
      const snippet = searchResult.snippet;

      // Enriched info from details (if available)
      const stats = detail?.statistics;
      const contentDetails = detail?.contentDetails;

      return {
        title: snippet.title,
        description: snippet.description,
        url: `https://youtube.com/watch?v=${videoId}`,
        source: 'youtube',
        viewCount: stats ? parseInt(stats.viewCount, 10) : 0,
        likeCount: stats ? parseInt(stats.likeCount, 10) : 0,
        durationSeconds: contentDetails
          ? this.parseDuration(contentDetails.duration)
          : 0,
        publishedAt: snippet.publishedAt,
      };
    });
  }

  private parseDuration(duration: string): number {
    // ISO 8601 duration format (PT#M#S, PT#H#M#S, etc.)
    const matches = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!matches) return 0;

    const hours = parseInt(matches[1] || '0', 10);
    const minutes = parseInt(matches[2] || '0', 10);
    const seconds = parseInt(matches[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }
}
