import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller(['v1/global/curriculum', 'global/curriculum'])
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Get('alignments')
  getAlignments(
    @Query('curriculum') curriculum: string,
    @Query('grade') grade?: string,
  ) {
    return this.curriculumService.getCurriculumAlignments(curriculum, grade);
  }

  @Get('concepts/:conceptId')
  getConceptAlignments(@Param('conceptId') conceptId: string) {
    return this.curriculumService.getAlignmentsForConcept(conceptId);
  }

  @Post('alignments')
  @UseGuards(JwtAuthGuard)
  alignConcept(
    @Body()
    body: {
      conceptId: string;
      curriculum: string;
      region?: string;
      grade?: string;
      code?: string;
      source?: string;
      confidence?: number;
      metadata?: Record<string, any>;
    },
  ) {
    return this.curriculumService.alignConcept(body);
  }
}
