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
import { KnowledgeService } from './knowledge.service';
import {
  CreateKnowledgeDto,
  KnowledgeContributionDto,
  KnowledgeGateInput,
} from './knowledge.types';
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

@Controller(['v1/verified-learning/knowledge', 'verified-learning/knowledge'])
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Query('type') type?: string) {
    return this.knowledge.listActive(type);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  get(@Param('id') id: string) {
    return this.knowledge.getVerifiedKnowledge(id);
  }

  @Post('promote')
  @UseGuards(JwtAuthGuard)
  async promote(
    @Body()
    body: {
      gateInput: KnowledgeGateInput;
      dto: CreateKnowledgeDto;
    },
  ) {
    return this.knowledge.promoteClaimToKnowledge(body.gateInput, body.dto);
  }

  @Post(':id/retire')
  @UseGuards(JwtAuthGuard)
  async retire(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.knowledge.retireKnowledge(id, reason || 'Knowledge retired by governance review');
  }

  @Post('contributions')
  @UseGuards(JwtAuthGuard)
  async contribute(
    @Body() dto: KnowledgeContributionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.knowledge.contributeKnowledge(dto);
  }
}
