import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OrchestratorService } from '../services/orchestrator.service';
// Assuming JwtAuthGuard exists in shared/auth
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Content Intelligence')
@Controller('content')
export class ContentSearchController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Get('search')
  // @UseGuards(JwtAuthGuard) // Enable if auth is ready
  @ApiOperation({
    summary: 'Search for educational content from YouTube and Web',
  })
  @ApiQuery({ name: 'query', required: true, description: 'Search term' })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'User ID for personalization',
  })
  @ApiQuery({
    name: 'topicId',
    required: false,
    description: 'Topic ID context',
  })
  async search(
    @Query('query') query: string,
    @Query('userId') userId: string,
    @Query('topicId') topicId: string = 'general',
  ) {
    return this.orchestratorService.searchContent(query, userId, topicId);
  }

  @Post('engage')
  @ApiOperation({ summary: 'Track user engagement with a resource' })
  async trackEngagement(
    @Body()
    body: {
      resourceId: string;
      type: 'CLICK' | 'LIKE' | 'VIEW';
      userId: string;
    },
  ) {
    return this.orchestratorService.trackEngagement(
      body.resourceId,
      body.type,
      body.userId,
    );
  }
}
