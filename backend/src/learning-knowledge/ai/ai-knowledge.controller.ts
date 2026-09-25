import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/role.enum';
import { AiKnowledgeService } from './ai-knowledge.service';
import { AiProvenanceService } from './provenance/ai-provenance.service';

@Controller(['v1/learning-knowledge/ai', 'learning-knowledge/ai'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiKnowledgeController {
  constructor(
    private readonly aiKnowledgeService: AiKnowledgeService,
    private readonly provenanceService: AiProvenanceService,
  ) {}

  // ==========================================================================
  // TEACHER ENDPOINTS
  // ==========================================================================

  @Post('generate-example')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async generateExample(
    @Req() req: any,
    @Body() body: { knowledgeId: string; instructions?: string },
  ) {
    const actorId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.aiKnowledgeService.generateExample(
      actorId,
      body.knowledgeId,
      body.instructions,
      tenantId,
    );
  }

  @Post('generate-questions')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async generateQuestions(
    @Req() req: any,
    @Body() body: { knowledgeId: string; count?: number },
  ) {
    const actorId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.aiKnowledgeService.generateQuestions(
      actorId,
      body.knowledgeId,
      body.count ?? 3,
      tenantId,
    );
  }

  @Post('suggest-objectives')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async suggestObjectives(
    @Req() req: any,
    @Body() body: { knowledgeId: string },
  ) {
    const actorId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.aiKnowledgeService.suggestObjectives(
      actorId,
      body.knowledgeId,
      tenantId,
    );
  }

  @Post('suggest-prerequisites')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async suggestPrerequisites(
    @Req() req: any,
    @Body() body: { knowledgeId: string },
  ) {
    const actorId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.aiKnowledgeService.suggestPrerequisites(
      actorId,
      body.knowledgeId,
      tenantId,
    );
  }

  @Post('suggest-relationships')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async suggestRelationships(
    @Req() req: any,
    @Body() body: { knowledgeId: string },
  ) {
    const actorId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.aiKnowledgeService.suggestRelationships(
      actorId,
      body.knowledgeId,
      tenantId,
    );
  }

  @Post('analyze-quality')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async analyzeQuality(
    @Req() req: any,
    @Body() body: { knowledgeId: string },
  ) {
    const actorId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.aiKnowledgeService.analyzeQuality(
      actorId,
      body.knowledgeId,
      tenantId,
    );
  }

  @Post('differentiate')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async differentiate(
    @Req() req: any,
    @Body() body: { knowledgeId: string; targetLevel: string },
  ) {
    const actorId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.aiKnowledgeService.differentiateContent(
      actorId,
      body.knowledgeId,
      body.targetLevel,
      tenantId,
    );
  }

  // ==========================================================================
  // STUDENT ENDPOINTS
  // ==========================================================================

  @Post('explain')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async explain(
    @Req() req: any,
    @Body() body: { knowledgeId: string; query: string; sectionId?: string },
  ) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.aiKnowledgeService.explain(
      learnerId,
      body.knowledgeId,
      body.query,
      body.sectionId,
      tenantId,
    );
  }

  @Post('hint')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async hint(
    @Req() req: any,
    @Body()
    body: {
      knowledgeId: string;
      questionId?: string;
      attemptCount?: number;
      expectedAnswer?: string;
    },
  ) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.aiKnowledgeService.hint(
      learnerId,
      body.knowledgeId,
      body.questionId,
      body.attemptCount ?? 1,
      body.expectedAnswer,
      tenantId,
    );
  }

  @Post('example')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async example(
    @Req() req: any,
    @Body() body: { knowledgeId: string; concept?: string },
  ) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.aiKnowledgeService.example(
      learnerId,
      body.knowledgeId,
      body.concept,
      tenantId,
    );
  }

  @Post('summarize')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async summarize(
    @Req() req: any,
    @Body() body: { knowledgeId: string },
  ) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.aiKnowledgeService.summarize(
      learnerId,
      body.knowledgeId,
      tenantId,
    );
  }

  @Post('search-assist')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async searchAssist(
    @Req() req: any,
    @Body() body: { query: string },
  ) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.aiKnowledgeService.searchAssist(
      learnerId,
      body.query,
      tenantId,
    );
  }

  // ==========================================================================
  // AUDIT & PROVENANCE ENDPOINTS
  // ==========================================================================

  @Get('provenance/:id')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getProvenance(@Param('id') id: string) {
    const record = await this.provenanceService.getProvenance(id);
    if (!record) {
      throw new NotFoundException(`Provenance record with ID '${id}' not found.`);
    }
    return record;
  }
}
