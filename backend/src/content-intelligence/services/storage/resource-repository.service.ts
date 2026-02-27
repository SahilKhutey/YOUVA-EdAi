import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Resource } from '../../interfaces/resource.interface';

@Injectable()
export class ResourceRepositoryService {
  private readonly logger = new Logger(ResourceRepositoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async saveResources(resources: Resource[]) {
    for (const resource of resources) {
      try {
        await this.prisma.resource.upsert({
          where: { url: resource.url },
          update: {
            title: resource.title,
            description: resource.description,
            viewCount: resource.viewCount,
            likeCount: resource.likeCount,
            score: (resource as any).score || 0,
            updatedAt: new Date(),
          },
          create: {
            title: resource.title,
            description: resource.description,
            url: resource.url,
            source: resource.source,
            viewCount: resource.viewCount || 0,
            likeCount: resource.likeCount || 0,
            durationSeconds: resource.durationSeconds || 0,
            publishedAt: resource.publishedAt
              ? new Date(resource.publishedAt)
              : undefined,
            score: (resource as any).score || 0,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to save resource ${resource.url}: ${error.message}`,
        );
      }
    }
  }

  async getTopResources(
    query: string,
    limit: number = 10,
  ): Promise<Resource[]> {
    // Simple implementation: search by title contains query (very basic)
    // In a real app, we'd use Full Text Search or vector search.
    try {
      const resources = await this.prisma.resource.findMany({
        where: {
          title: { contains: query },
        },
        orderBy: { score: 'desc' },
        take: limit,
      });

      return resources.map((r) => ({
        title: r.title,
        description: r.description || '',
        url: r.url,
        source: r.source as 'youtube' | 'web',
        viewCount: r.viewCount,
        likeCount: r.likeCount,
        durationSeconds: r.durationSeconds,
        publishedAt: r.publishedAt ? r.publishedAt.toISOString() : undefined,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch top resources: ${error.message}`);
      return [];
    }
  }

  async incrementEngagement(resourceId: string, type: string) {
    try {
      const updateData: any = {};
      if (type === 'VIEW' || type === 'CLICK')
        updateData.viewCount = { increment: 1 };
      if (type === 'LIKE') updateData.likeCount = { increment: 1 };

      if (Object.keys(updateData).length > 0) {
        // We assume resourceId is the URL for now as per my schema design (url @unique, acting as ID?)
        // Wait, schema has `id` UUID and `url` unique.
        // If frontend passes UUID, use `where: { id: resourceId }`
        // If frontend passes URL, use `where: { url: resourceId }`
        // Let's assume ID is UUID.

        await this.prisma.resource.update({
          where: { id: resourceId }, // Assuming ID is passed. If URL, change to { url: resourceId }
          data: updateData,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to update engagement: ${error.message}`);
    }
  }
}
