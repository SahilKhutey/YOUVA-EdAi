export interface Resource {
  title: string;
  description: string;
  url: string;
  source: 'youtube' | 'web';
  viewCount?: number;
  likeCount?: number;
  durationSeconds?: number;
  publishedAt?: string;
}
