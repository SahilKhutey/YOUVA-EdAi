import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OrchestratorService } from '../services/orchestrator.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

// Login required. These routes used to be open and trusted a userId sent by the caller.
@UseGuards(JwtAuthGuard)
@ApiTags('Content Intelligence')
@Controller('content')
export class ContentSearchController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Get('search')
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
    @Req() req: any,
    @Query('query') query: string,
    @Query('topicId') topicId: string = 'general',
  ) {
    // The user is always the logged-in user; a userId in the query string is ignored.
    return this.orchestratorService.searchContent(query, req.user.id, topicId);
  }

  @Post('engage')
  @ApiOperation({ summary: 'Track user engagement with a resource' })
  async trackEngagement(
    @Req() req: any,
    @Body()
    body: {
      resourceId: string;
      type: 'CLICK' | 'LIKE' | 'VIEW';
    },
  ) {
    return this.orchestratorService.trackEngagement(
      body.resourceId,
      body.type,
      req.user.id,
    );
  }
}
