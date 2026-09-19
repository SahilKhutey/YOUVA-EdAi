import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { EcosystemGraphService } from './ecosystem-graph.service';
import { PartnerGatewayService } from './partner-gateway.service';
import { EcosystemEventBusService } from './ecosystem-event-bus.service';
import { CurriculumIntelligenceService } from './curriculum-intelligence.service';
import { FederatedAnalyticsService } from './federated-analytics.service';
import {
  EcosystemNodeType,
  EdgeRelationshipType,
  EdgeStatus,
  PartnerType,
  PartnerStatus,
  PartnerScope,
} from './n21-types';

@Controller('api/v1/ecosystem')
export class EcosystemIntelligenceController {
  constructor(
    private readonly graphService: EcosystemGraphService,
    private readonly partnerGateway: PartnerGatewayService,
    private readonly eventBus: EcosystemEventBusService,
    private readonly curriculumService: CurriculumIntelligenceService,
    private readonly analyticsService: FederatedAnalyticsService
  ) {}

  // --- Ecosystem Graph Endpoints ---

  @Get('nodes')
  public listNodes(
    @Query('type') type?: EcosystemNodeType,
    @Query('organizationId') organizationId?: string
  ) {
    return this.graphService.listNodes(type, organizationId);
  }

  @Post('nodes')
  public addNode(
    @Body()
    dto: {
      id?: string;
      type: EcosystemNodeType;
      label: string;
      organizationId: string;
      metadata?: Record<string, any>;
    }
  ) {
    return this.graphService.addNode(dto);
  }

  @Get('nodes/:id')
  public getNode(@Param('id') id: string) {
    return this.graphService.getNode(id);
  }

  @Get('nodes/:id/lineage')
  public getNodeLineage(@Param('id') id: string) {
    return this.graphService.getLineageTrail(id);
  }

  @Get('edges')
  public listEdges(
    @Query('sourceId') sourceId?: string,
    @Query('targetId') targetId?: string,
    @Query('status') status?: EdgeStatus
  ) {
    return this.graphService.listEdges(sourceId, targetId, status);
  }

  @Post('edges')
  public addEdge(
    @Body()
    dto: {
      sourceId: string;
      targetId: string;
      relationshipType: EdgeRelationshipType;
      authority: string;
      confidence: number;
      scope: string;
      status?: EdgeStatus;
    }
  ) {
    return this.graphService.addEdge(dto);
  }

  @Get('edges/:id')
  public getEdge(@Param('id') id: string) {
    return this.graphService.getEdge(id);
  }

  @Post('edges/:id/status')
  public updateEdgeStatus(
    @Param('id') id: string,
    @Body('status') status: EdgeStatus,
    @Body('note') note?: string
  ) {
    return this.graphService.updateEdgeStatus(id, status, note);
  }

  @Post('edges/:id/dispute')
  public recordDispute(
    @Param('id') id: string,
    @Body() dto: { disputingAuthority: string; reason: string }
  ) {
    return this.graphService.recordDispute(id, dto.disputingAuthority, dto.reason);
  }

  // --- Partner Gateway Endpoints ---

  @Get('partners')
  public listPartners(
    @Query('type') type?: PartnerType,
    @Query('status') status?: PartnerStatus
  ) {
    return this.partnerGateway.listPartners(type, status);
  }

  @Post('partners')
  public registerPartner(
    @Body()
    dto: {
      organizationId: string;
      name: string;
      partnerType: PartnerType;
      scopes: PartnerScope[];
    }
  ) {
    return this.partnerGateway.registerPartner(dto);
  }

  @Get('partners/:id')
  public getPartner(@Param('id') id: string) {
    return this.partnerGateway.getPartner(id);
  }

  @Post('partners/:id/status')
  public updatePartnerStatus(
    @Param('id') id: string,
    @Body('status') status: PartnerStatus
  ) {
    return this.partnerGateway.updatePartnerStatus(id, status);
  }

  @Post('partners/:id/offboard')
  public offboardPartner(
    @Param('id') id: string,
    @Body('reason') reason: string
  ) {
    return this.partnerGateway.offboardPartner(id, reason || 'Voluntary partner offboarding');
  }

  // --- Event Bus & Authority Matrix Endpoints ---

  @Post('events')
  public ingestEvent(
    @Body()
    dto: {
      eventType: string;
      sourceOrganizationId: string;
      aggregateType: string;
      aggregateId: string;
      correlationId: string;
      version: number;
      payload: Record<string, any>;
      idempotencyKey: string;
    }
  ) {
    return this.eventBus.ingestExternalEvent(dto);
  }

  @Get('events/conflicts')
  public getConflicts() {
    return this.eventBus.getConflicts();
  }

  @Get('authority-matrix')
  public getAuthorityMatrix() {
    return this.eventBus.getAuthorityMatrix();
  }

  // --- Curriculum Intelligence Endpoints ---

  @Post('curriculum/mapping')
  public mapObjective(
    @Body()
    dto: {
      curriculumId: string;
      objectiveText: string;
      mappedSkillId: string;
      mappedCapabilityId: string;
      confidence: number;
      qualitativeGapNote: string;
    }
  ) {
    return this.curriculumService.mapObjective(dto);
  }

  @Get('curriculum/:id/crosswalk')
  public getCurriculumCrosswalk(@Param('id') id: string) {
    return this.curriculumService.getCurriculumCrosswalk(id);
  }

  @Get('curriculum/:id/gaps')
  public analyzeCurriculumGaps(@Param('id') id: string) {
    return this.curriculumService.analyzeCurriculumGaps(id);
  }

  @Get('curriculum/:id/teacher-insights')
  public getTeacherInsights(@Param('id') id: string) {
    return this.curriculumService.getTeacherDevelopmentInsights(id);
  }

  // --- Federated Analytics & Health Endpoints ---

  @Post('analytics/cohort')
  public computeCohortMetric(
    @Body()
    dto: {
      metricName: string;
      sampleValues: number[];
      applyDifferentialPrivacy?: boolean;
    }
  ) {
    return this.analyticsService.computeCohortMetric(
      dto.metricName,
      dto.sampleValues,
      dto.applyDifferentialPrivacy
    );
  }

  @Get('analytics/supply-demand')
  public getSupplyDemandMap() {
    return this.analyticsService.getCapabilitySupplyDemandMap();
  }

  @Get('analytics/health')
  public getEcosystemHealthIndex() {
    return this.analyticsService.getEcosystemHealthIndex();
  }
}
