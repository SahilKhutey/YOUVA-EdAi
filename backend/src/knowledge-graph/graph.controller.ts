import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { GraphTraversalService } from './graph-traversal.service';
import { GraphValidationService } from './graph-validation.service';
import { LearningPathService } from './learning-path.service';

@Controller(['v1/knowledge-graph', 'knowledge-graph'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class GraphController {
  constructor(
    private readonly traversalService: GraphTraversalService,
    private readonly validationService: GraphValidationService,
    private readonly learningPathService: LearningPathService,
  ) {}

  /**
   * Generates a personalized, explainable learning path for the student.
   */
  @Get(':id/path')
  async getLearningPath(
    @Req() req: any,
    @Param('id') id: string,
    @Query('courseId') courseId?: string,
  ) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    return this.learningPathService.buildPath(learnerId, id, {
      tenantId,
      courseId,
    });
  }

  /**
   * Retrieves upstream prerequisites for a knowledge object.
   * By default, student-facing returns published nodes only.
   */
  @Get(':id/prerequisites')
  async getPrerequisites(
    @Req() req: any,
    @Param('id') id: string,
    @Query('depth') depth?: string,
  ) {
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    const maxDepth = depth ? parseInt(depth, 10) : 3;
    return this.traversalService.getPrerequisites(id, {
      tenantId,
      publishedOnly: req.user?.role === Role.STUDENT,
      maxDepth,
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
    return this.traversalService.getDependents(id, {
      tenantId,
      publishedOnly: req.user?.role === Role.STUDENT,
      maxDepth,
    });
  }

  /**
   * Retrieves full subgraph around a concept for visualization.
   */
  @Get(':id/subgraph')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getSubgraph(
    @Req() req: any,
    @Param('id') id: string,
    @Query('depth') depth?: string,
  ) {
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    const maxDepth = depth ? parseInt(depth, 10) : 2;
    return this.traversalService.getSubgraph(id, maxDepth, tenantId);
  }

  /**
   * Health and governance metrics for the tenant's knowledge graph.
   */
  @Get('health')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getGraphHealth(@Req() req: any) {
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    return this.validationService.validateGraphHealth(tenantId);
  }

  /**
   * Pre-validates a proposed relationship (checks cycles, self-reference, tenant isolation).
   */
  @Post('validate')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async validateRelationship(
    @Req() req: any,
    @Body() input: { sourceId: string; targetId: string; relation: string },
  ) {
    const tenantId = req.tenantId || req.user?.tenantId || 'default-tenant';
    return this.validationService.validateRelationship(
      input.sourceId,
      input.targetId,
      input.relation,
      tenantId,
    );
  }
}
