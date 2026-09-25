import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Optional,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { LearningKnowledgeService } from './learning-knowledge.service';
import {
  CreateKnowledgeDto,
  UpdateKnowledgeDto,
  PublishKnowledgeDto,
  CreateRelationshipDto,
  CreateKnowledgeEventDto,
  SearchKnowledgeDto,
  StartSessionDto,
  UpdateSessionDto,
  EvaluateAnswerDto,
} from './dto';
import { KnowledgeAccessGuard } from './guards/knowledge-access.guard';
import { LearningPathService } from '../knowledge-graph/learning-path.service';
import { GraphTraversalService } from '../knowledge-graph/graph-traversal.service';
import { GraphValidationService } from '../knowledge-graph/graph-validation.service';

@Controller(['v1/learning-knowledge', 'learning-knowledge'])
@UseGuards(JwtAuthGuard, RolesGuard, KnowledgeAccessGuard)
export class LearningKnowledgeController {
  constructor(
    private readonly knowledgeService: LearningKnowledgeService,
    @Optional() private readonly learningPathService?: LearningPathService,
    @Optional() private readonly graphTraversalService?: GraphTraversalService,
    @Optional() private readonly graphValidationService?: GraphValidationService,
  ) {}

  // ==========================================================================
  // TEACHER APIS
  // ==========================================================================

  /**
   * Creates a draft knowledge object with initial version v1.
   */
  @Post()
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: any, @Body() input: CreateKnowledgeDto) {
    const actorId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.knowledgeService.create(actorId, input, tenantId);
  }

  /**
   * Retrieves teacher's knowledge library and status counts.
   */
  @Get('teacher')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getTeacherKnowledge(@Req() req: any) {
    const actorId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.knowledgeService.getTeacherKnowledge(actorId, tenantId);
  }

  /**
   * Retrieves detailed teacher view for a specific knowledge object.
   */
  @Get('teacher/:id')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getTeacherKnowledgeDetail(@Req() req: any, @Param('id') id: string) {
    const actorId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.knowledgeService.getTeacherKnowledgeDetail(actorId, id, tenantId);
  }

  /**
   * Updates knowledge object, creating version N + 1 and resetting status to DRAFT.
   */
  @Patch('teacher/:id')
  @Roles(Role.TEACHER, Role.ADMIN)
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() input: UpdateKnowledgeDto,
  ) {
    const actorId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.knowledgeService.update(actorId, id, input, tenantId);
  }

  /**
   * Submits a DRAFT knowledge object for review (DRAFT -> IN_REVIEW).
   */
  @Post('teacher/:id/submit')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async submitForReview(@Req() req: any, @Param('id') id: string) {
    const actorId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.knowledgeService.submitForReview(actorId, id, tenantId);
  }

  /**
   * Approves a knowledge version (IN_REVIEW -> APPROVED).
   */
  @Post('teacher/:id/approve')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async approve(@Req() req: any, @Param('id') id: string) {
    const actorId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.knowledgeService.approve(actorId, id, tenantId);
  }

  /**
   * Atomically publishes approved knowledge version (APPROVED -> PUBLISHED).
   */
  @Post('teacher/:id/publish')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async publish(
    @Req() req: any,
    @Param('id') id: string,
    @Body() _body: PublishKnowledgeDto,
  ) {
    const actorId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.knowledgeService.publish(actorId, id, tenantId);
  }

  /**
   * Retrieves version history for a knowledge object.
   */
  @Get('teacher/:id/versions')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getVersions(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.knowledgeService.getVersions(id, tenantId);
  }

  /**
   * Creates a semantic relationship between two knowledge objects.
   */
  @Post('relationships')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createRelationship(
    @Req() req: any,
    @Body() input: CreateRelationshipDto,
  ) {
    const actorId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.knowledgeService.createRelationship(actorId, input, tenantId);
  }

  // ==========================================================================
  // STUDENT APIS
  // ==========================================================================

  /**
   * Evaluates student answer server-side against canonical content blocks.
   * Client-side correctness claims are strictly untrusted.
   */
  @Post('evaluate-answer')
  @HttpCode(HttpStatus.OK)
  async evaluateAnswer(
    @Req() req: any,
    @Body() input: EvaluateAnswerDto,
  ) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    return this.knowledgeService.evaluateAnswer(learnerId, input, tenantId);
  }

  /**
   * Retrieves a learning session by ID.
   */
  @Get('sessions/:sessionId')
  async getSession(
    @Req() req: any,
    @Param('sessionId') sessionId: string,
  ) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    return this.knowledgeService.getSession(learnerId, sessionId, tenantId);
  }

  /**
   * Updates student progress position in an active session.
   */
  @Patch('sessions/:sessionId')
  async updateSessionPosition(
    @Req() req: any,
    @Param('sessionId') sessionId: string,
    @Body() input: UpdateSessionDto,
  ) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    return this.knowledgeService.updateSessionPosition(learnerId, sessionId, input, tenantId);
  }

  /**
   * Marks a learning session as COMPLETED.
   */
  @Post('sessions/:sessionId/complete')
  @HttpCode(HttpStatus.OK)
  async completeSession(
    @Req() req: any,
    @Param('sessionId') sessionId: string,
  ) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    return this.knowledgeService.completeSession(learnerId, sessionId, tenantId);
  }

  /**
   * Starts or resumes a learning session for a published knowledge object.
   */
  @Post(':id/sessions')
  @HttpCode(HttpStatus.CREATED)
  async startSession(
    @Req() req: any,
    @Param('id') id: string,
    @Body() input: StartSessionDto,
  ) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    return this.knowledgeService.startSession(learnerId, id, input, tenantId);
  }

  /**
   * Searches published knowledge items.
   */
  @Get()
  async search(
    @Req() req: any,
    @Query() query: SearchKnowledgeDto,
  ) {
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    return this.knowledgeService.search(query, tenantId);
  }

  /**
   * Retrieves a published knowledge object for student consumption.
   * Drafts, in-review, and archived items return 404.
   */
  @Get(':id')
  async getForStudent(@Req() req: any, @Param('id') id: string) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    return this.knowledgeService.getForStudent(learnerId, id, tenantId);
  }

  /**
   * Retrieves related knowledge items for a published object.
   */
  @Get(':id/related')
  async getRelated(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    return this.knowledgeService.getRelated(id, tenantId);
  }

  /**
   * Retrieves prerequisites for a knowledge object.
   */
  @Get(':id/prerequisites')
  async getPrerequisites(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    return this.knowledgeService.getPrerequisites(id, tenantId);
  }

  /**
   * Health and governance metrics for the tenant's knowledge graph.
   */
  @Get('graph/health')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getGraphHealth(@Req() req: any) {
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    if (!this.graphValidationService) {
      return { totalNodes: 0, totalRelationships: 0, warnings: [] };
    }
    return this.graphValidationService.validateGraphHealth(tenantId);
  }

  /**
   * Pre-validates a proposed relationship.
   */
  @Post('relationships/validate')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async validateRelationship(
    @Req() req: any,
    @Body() input: { sourceId: string; targetId: string; relation: string },
  ) {
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    if (!this.graphValidationService) {
      return { isValid: true, errors: [], warnings: [] };
    }
    return this.graphValidationService.validateRelationship(
      input.sourceId,
      input.targetId,
      input.relation,
      tenantId,
    );
  }

  /**
   * Generates an explainable learning path with prerequisite readiness.
   */
  @Get(':id/path')
  async getLearningPath(
    @Req() req: any,
    @Param('id') id: string,
    @Query('courseId') courseId?: string,
  ) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    if (!this.learningPathService) {
      throw new NotFoundException('Learning path service unavailable');
    }
    return this.learningPathService.buildPath(learnerId, id, {
      tenantId,
      courseId,
    });
  }

  /**
   * Retrieves downstream concepts that depend on this knowledge object.
   */
  @Get(':id/dependents')
  async getDependents(
    @Req() req: any,
    @Param('id') id: string,
    @Query('depth') depth?: string,
  ) {
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    const maxDepth = depth ? parseInt(depth, 10) : 3;
    if (!this.graphTraversalService) {
      return [];
    }
    return this.graphTraversalService.getDependents(id, {
      tenantId,
      publishedOnly: req.user?.role === Role.STUDENT,
      maxDepth,
    });
  }

  /**
   * Records a student learning interaction event against a concrete version.
   */
  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  async recordEvent(
    @Req() req: any,
    @Body() input: CreateKnowledgeEventDto,
  ) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    return this.knowledgeService.recordEvent(learnerId, input, tenantId);
  }
}
