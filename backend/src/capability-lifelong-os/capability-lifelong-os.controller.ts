import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CapabilityGraphService } from './capability-graph.service';
import { LearnerGoalsPathwayService } from './learner-goals-pathway.service';
import { OpportunityOutcomeIntelligenceService } from './opportunity-outcome-intelligence.service';
import { AiCapabilityCoachService } from './ai-capability-coach.service';
import { CapabilityLevel, LearnerGoalStatus, OpportunityType, OutcomeCategory } from './n20-types';

@Controller('api/v1/capability')
export class CapabilityLifelongOsController {
  constructor(
    private readonly capabilityGraph: CapabilityGraphService,
    private readonly pathwayService: LearnerGoalsPathwayService,
    private readonly opportunityIntelligence: OpportunityOutcomeIntelligenceService,
    private readonly aiCoachService: AiCapabilityCoachService
  ) {}

  // --- Capability Graph Endpoints ---

  @Get('graph')
  public listCapabilities(@Query('domain') domain?: string) {
    return this.capabilityGraph.listCapabilities(domain);
  }

  @Get('graph/:id')
  public getCapability(@Param('id') id: string) {
    return this.capabilityGraph.getCapability(id);
  }

  @Post('graph')
  public registerCapability(
    @Body()
    dto: {
      slug: string;
      title: string;
      domain: string;
      description: string;
      level: CapabilityLevel;
      prerequisites?: string[];
      relatedSkills?: string[];
    }
  ) {
    return this.capabilityGraph.registerCapability(dto);
  }

  @Post('graph/:id/dimensions')
  public updateDimensions(
    @Param('id') id: string,
    @Body() dto: { dimensions: any; context?: any }
  ) {
    return this.capabilityGraph.updateDimensions(id, dto.dimensions, dto.context);
  }

  @Get('graph/:id/decay')
  public checkDecay(@Param('id') id: string) {
    return this.capabilityGraph.checkDecayAndRevalidation(id);
  }

  @Get('graph/:id/audit')
  public auditProfile(@Param('id') id: string) {
    return this.capabilityGraph.auditMultiDimensionalProfile(id);
  }

  @Get('inflation-signals')
  public getInflationSignals() {
    return this.capabilityGraph.getInflationSignals();
  }

  // --- Learner Goals & Pathway Endpoints ---

  @Post('goals')
  public createGoal(
    @Body()
    dto: {
      learnerId: string;
      targetCapabilityId: string;
      title: string;
      rationale: string;
      targetDate: string;
      preferredPathwayType?: any;
    }
  ) {
    return this.pathwayService.createGoal(dto);
  }

  @Get('goals/:id')
  public getGoal(@Param('id') id: string) {
    return this.pathwayService.getGoal(id);
  }

  @Get('goals/learner/:learnerId')
  public listGoalsByLearner(@Param('learnerId') learnerId: string) {
    return this.pathwayService.listGoalsByLearner(learnerId);
  }

  @Post('goals/:id/status')
  public updateGoalStatus(
    @Param('id') id: string,
    @Body('status') status: LearnerGoalStatus
  ) {
    return this.pathwayService.updateGoalStatus(id, status);
  }

  @Post('goals/:id/pathway')
  public switchActivePathway(
    @Param('id') id: string,
    @Body('pathwayId') pathwayId: string
  ) {
    return this.pathwayService.switchActivePathway(id, pathwayId);
  }

  @Post('goals/:id/complete-step')
  public completeStep(
    @Param('id') id: string,
    @Body() dto: { pathwayId: string; stepIndex: number }
  ) {
    return this.pathwayService.completePathwayStep(id, dto.pathwayId, dto.stepIndex);
  }

  @Get('gap-diagnosis')
  public diagnoseGap(
    @Query('learnerId') learnerId: string,
    @Query('targetCapabilityId') targetCapabilityId: string
  ) {
    return this.pathwayService.diagnoseCapabilityGap(learnerId, targetCapabilityId);
  }

  // --- Opportunity & Outcome Intelligence Endpoints ---

  @Get('opportunities')
  public listOpportunities(@Query('type') type?: OpportunityType) {
    return this.opportunityIntelligence.listOpportunities(type);
  }

  @Post('opportunities')
  public ingestOpportunity(
    @Body()
    dto: {
      title: string;
      organization: string;
      description: string;
      opportunityType: OpportunityType;
      requiredCapabilities: string[];
      preferredCapabilities?: string[];
      location: string;
      isRemote: boolean;
      compensationRange: string;
    }
  ) {
    return this.opportunityIntelligence.ingestOpportunity(dto);
  }

  @Get('opportunities/:id/compatibility')
  public evaluateCompatibility(
    @Param('id') id: string,
    @Query('learnerId') learnerId: string
  ) {
    return this.opportunityIntelligence.evaluateCompatibility(id, learnerId);
  }

  @Post('experiences')
  public recordExperience(
    @Body()
    dto: {
      learnerId: string;
      title: string;
      role: string;
      organization: string;
      startDate: string;
      endDate?: string;
      isCurrent: boolean;
      validatedCapabilities: string[];
      evidenceIds?: string[];
      narrative: string;
    }
  ) {
    return this.opportunityIntelligence.recordExperience(dto);
  }

  @Get('experiences/:learnerId')
  public getExperiences(@Param('learnerId') learnerId: string) {
    return this.opportunityIntelligence.getExperiences(learnerId);
  }

  @Post('outcomes')
  public recordOutcome(
    @Body()
    dto: {
      learnerId: string;
      category: OutcomeCategory;
      title: string;
      metricValue: string;
      associatedCapabilityIds: string[];
      correlationStrength: number;
    }
  ) {
    return this.opportunityIntelligence.recordLongitudinalOutcome(dto);
  }

  @Get('outcomes')
  public getOutcomes(@Query('learnerId') learnerId?: string) {
    return this.opportunityIntelligence.getLongitudinalOutcomes(learnerId);
  }

  @Post('research-registry')
  public registerResearch(
    @Body()
    dto: {
      experimentName: string;
      hypothesis: string;
      primaryOutcomeMetric: string;
      counterfactualMethodology: string;
      targetSampleSize: number;
    }
  ) {
    return this.opportunityIntelligence.registerResearchExperiment(dto);
  }

  @Get('research-registry')
  public getResearchRegistry() {
    return this.opportunityIntelligence.getResearchExperiments();
  }

  // --- AI Capability Coach Endpoints ---

  @Post('coach')
  public requestCoaching(
    @Body()
    dto: {
      learnerId: string;
      capabilityId: string;
      prompt: string;
      scaffoldingPreference?: any;
    }
  ) {
    return this.aiCoachService.requestCoaching(dto);
  }

  @Post('coach/:id/ai-removal-test')
  public runAiRemovalTest(
    @Param('id') id: string,
    @Body() dto: { unassistedScore: number; assistedScore: number }
  ) {
    return this.aiCoachService.runAiRemovalTest(id, dto.unassistedScore, dto.assistedScore);
  }

  @Post('coach/:id/teacher-override')
  public applyTeacherOverride(
    @Param('id') id: string,
    @Body()
    dto: {
      teacherId: string;
      reasonCode: any;
      overrideNotes: string;
    }
  ) {
    return this.aiCoachService.applyTeacherOverride(id, dto.teacherId, dto.reasonCode, dto.overrideNotes);
  }

  @Get('coach')
  public getCoachingInteractions(@Query('learnerId') learnerId?: string) {
    return this.aiCoachService.getInteractions(learnerId);
  }
}
