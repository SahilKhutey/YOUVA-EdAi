import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { LearningGraphService } from './learning-graph.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller(['v1/global/graph', 'global/graph'])
export class GlobalGraphController {
  constructor(private readonly graph: LearningGraphService) {}

  @Get('concepts/:id')
  getConcept(@Param('id') id: string) {
    return this.graph.getConcept(id);
  }

  @Get('concepts/:id/prerequisites')
  getPrerequisites(@Param('id') id: string) {
    return this.graph.getPrerequisites(id);
  }

  @Get('concepts/:id/next')
  getNext(@Param('id') id: string) {
    return this.graph.getNextCandidates(id);
  }

  @Post('concepts')
  @UseGuards(JwtAuthGuard)
  createConcept(
    @Body()
    body: {
      canonicalKey: string;
      name: string;
      description?: string;
      subject: string;
      domain?: string;
      ageMin?: number;
      ageMax?: number;
      metadata?: Record<string, any>;
    },
  ) {
    return this.graph.createConcept(body);
  }

  @Post('relations')
  @UseGuards(JwtAuthGuard)
  createRelation(
    @Body()
    body: {
      fromConceptId: string;
      toConceptId: string;
      relationType: string;
      weight?: number;
      metadata?: Record<string, any>;
    },
  ) {
    return this.graph.createRelation(body);
  }
}
