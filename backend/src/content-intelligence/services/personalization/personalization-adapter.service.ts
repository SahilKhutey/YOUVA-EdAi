import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PersonalizationAdapterService {
  private readonly logger = new Logger(PersonalizationAdapterService.name);
  private readonly masteryServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Assuming Mastery Service is part of the same backend or a microservice
    // If it's a microservice, use URL from config.
    // If it's internal module, we might inject a service directly.
    // Following prompt "Content Service calls Mastery Service API", implying HTTP or internal call.
    // I'll assume HTTP for separation or local via module if it was monolithic.
    // "GET /mastery/user/{userId}/topic/{topicId}"

    this.masteryServiceUrl =
      this.configService.get<string>('MASTERY_SERVICE_URL') ||
      'http://localhost:3000/mastery';
  }

  async getMasteryLevel(userId: string, topicId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.masteryServiceUrl}/user/${userId}/topic/${topicId}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch mastery level for user ${userId} topic ${topicId}: ${error.message}`,
      );
      return null;
    }
  }

  calculatePersonalizationBoost(resource: any, masteryLevel: any): number {
    // Placeholder logic based on prompt
    // "Boost beginner content", "Boost advanced problem solving"

    if (!masteryLevel) return 1.0;

    // Example logic
    const userLevel = masteryLevel.level || 'beginner'; // beginner, intermediate, advanced
    const contentLevel = resource.level || 'beginner'; // We need to infer this from content?

    if (userLevel === contentLevel) return 1.5;

    return 1.0;
  }
}
