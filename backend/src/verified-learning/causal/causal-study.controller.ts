import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CausalStudyService } from './causal-study.service';
import { CausalStudyDto, InterventionEffectivenessDto } from './causal.types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    sub?: string;
    userId?: string;
    role?: string;
    email?: string;
  };
}

@Controller(['v1/verified-learning/studies', 'verified-learning/studies'])
export class CausalStudyController {
  constructor(private readonly studyService: CausalStudyService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async listStudies(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.studyService.listStudies({
      status,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createStudy(
    @Body() dto: CausalStudyDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const approver = req.user?.role === 'ADMIN' ? (req.user?.sub || req.user?.id) : undefined;
    return this.studyService.createStudy(dto, approver);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getStudy(@Param('id') id: string) {
    return this.studyService.getStudy(id);
  }

  @Post('interventions/effectiveness')
  @UseGuards(JwtAuthGuard)
  async recordEffectiveness(@Body() dto: InterventionEffectivenessDto) {
    return this.studyService.recordInterventionEffectiveness(dto);
  }

  @Get('interventions/effectiveness')
  @UseGuards(JwtAuthGuard)
  async getEffectiveness(
    @Query('type') type: string,
    @Query('conceptId') conceptId?: string,
  ) {
    return this.studyService.getInterventionEffectiveness(type, conceptId);
  }
}
