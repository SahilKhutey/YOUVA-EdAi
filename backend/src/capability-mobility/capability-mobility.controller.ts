import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CapabilityTranslationService } from './capability-translation.service';
import { CapabilityMobilityService } from './capability-mobility.service';
import { CollectiveLearningContributionService } from './collective-learning-contribution.service';
import { KnowledgeNetworkCurriculumService } from './knowledge-network-curriculum.service';
import {
  CapabilityTranslationMapping,
  TransferTaskEvaluation,
  CapabilityMobilityRequest,
  CollectiveLearningGroup,
  KnowledgeContribution,
  KnowledgeNode,
  EvidenceResponsiveCurriculum,
  CapabilityTrendSignal,
  NegativeEvidenceRecord,
  KillSwitchSubsystem,
  ContributionType,
} from './n23-types';

@Controller('capability-mobility')
export class CapabilityMobilityController {
  constructor(
    private readonly translationService: CapabilityTranslationService,
    private readonly mobilityService: CapabilityMobilityService,
    private readonly collectiveService: CollectiveLearningContributionService,
    private readonly knowledgeService: KnowledgeNetworkCurriculumService,
  ) {}

  // --- Translation Endpoints ---

  @Post('mapping')
  registerMapping(@Body() mapping: Partial<CapabilityTranslationMapping>) {
    return this.translationService.registerMapping(mapping);
  }

  @Get('mapping')
  listMappings(
    @Query('source') source?: string,
    @Query('target') target?: string,
    @Query('reviewStatus') reviewStatus?: string,
  ) {
    return this.translationService.listMappings({ source, target, reviewStatus });
  }

  @Post('translate')
  translateCapability(
    @Body()
    body: {
      sourceInstitution: string;
      sourceCapabilityCode: string;
      targetInstitution: string;
    },
  ) {
    return this.translationService.translateCapability(
      body.sourceInstitution,
      body.sourceCapabilityCode,
      body.targetInstitution,
    );
  }

  @Post('transfer-task')
  evaluateTransferTask(@Body() evaluation: Partial<TransferTaskEvaluation>) {
    return this.translationService.evaluateTransferTask(evaluation);
  }

  // --- Mobility Endpoints ---

  @Post('request')
  submitMobilityRequest(@Body() req: CapabilityMobilityRequest) {
    return this.mobilityService.submitMobilityRequest(req);
  }

  @Get('request/:mobilityId')
  getMobilityResult(@Param('mobilityId') mobilityId: string) {
    return this.mobilityService.getMobilityResult(mobilityId);
  }

  @Get('wallet/:learnerId')
  getWallet(@Param('learnerId') learnerId: string) {
    return this.mobilityService.getOrCreateLearningWallet(learnerId);
  }

  @Post('wallet/:learnerId/ref')
  addWalletRef(
    @Param('learnerId') learnerId: string,
    @Body()
    body: {
      type: 'CAPABILITY' | 'EVIDENCE' | 'CREDENTIAL' | 'PROJECT' | 'CONTRIBUTION';
      refId: string;
    },
  ) {
    return this.mobilityService.addWalletReference(learnerId, body.type, body.refId);
  }

  // --- Collective Learning & Contributions ---

  @Post('group')
  createGroup(@Body() group: Partial<CollectiveLearningGroup>) {
    return this.collectiveService.createLearningGroup(group);
  }

  @Post('group/:groupId/join')
  joinGroup(
    @Param('groupId') groupId: string,
    @Body()
    body: {
      learnerId: string;
      role?: 'FACILITATOR' | 'PARTICIPANT' | 'PEER_REVIEWER';
    },
  ) {
    return this.collectiveService.joinLearningGroup(groupId, body.learnerId, body.role);
  }

  @Get('group')
  listGroups(@Query('domain') domain?: string) {
    return this.collectiveService.listGroups(domain);
  }

  @Post('contribution')
  submitContribution(@Body() contrib: Partial<KnowledgeContribution>) {
    return this.collectiveService.submitKnowledgeContribution(contrib);
  }

  @Patch('contribution/:id/validate')
  validateContribution(
    @Param('id') id: string,
    @Body() body: { status: KnowledgeContribution['validationStatus'] },
  ) {
    return this.collectiveService.validateContribution(id, body.status);
  }

  @Get('contribution')
  listContributions(
    @Query('authorId') authorId?: string,
    @Query('type') type?: ContributionType,
  ) {
    return this.collectiveService.listContributions(authorId, type);
  }

  // --- Knowledge, Curriculum, Trends & Kill-Switches ---

  @Post('knowledge')
  addKnowledgeNode(@Body() node: Partial<KnowledgeNode>) {
    return this.knowledgeService.addKnowledgeNode(node);
  }

  @Get('knowledge')
  listKnowledgeNodes() {
    return this.knowledgeService.listKnowledgeNodes();
  }

  @Post('knowledge/conflict')
  flagConflict(@Body() body: { nodeId1: string; nodeId2: string }) {
    this.knowledgeService.flagKnowledgeConflict(body.nodeId1, body.nodeId2);
    return { status: 'CONFLICT_FLAGGED' };
  }

  @Post('knowledge/resolve-conflict')
  resolveConflict(
    @Body()
    body: {
      nodeId1: string;
      nodeId2: string;
      resolvedStatus: 'SUPPORTED' | 'PROBABLE' | 'OUTDATED';
      rationale: string;
    },
  ) {
    this.knowledgeService.resolveKnowledgeConflict(
      body.nodeId1,
      body.nodeId2,
      body.resolvedStatus,
      body.rationale,
    );
    return { status: 'CONFLICT_RESOLVED' };
  }

  @Get('curriculum')
  listCurricula() {
    return this.knowledgeService.listCurricula();
  }

  @Patch('curriculum/:id')
  updateCurriculum(
    @Param('id') id: string,
    @Body()
    body: {
      patch: Partial<EvidenceResponsiveCurriculum>;
      humanAuthority?: string;
    },
  ) {
    return this.knowledgeService.updateCurriculum(id, body.patch, body.humanAuthority);
  }

  @Get('trends')
  listTrends() {
    return this.knowledgeService.listTrendSignals();
  }

  @Post('trends')
  recordTrend(@Body() signal: Partial<CapabilityTrendSignal>) {
    return this.knowledgeService.recordTrendSignal(signal);
  }

  @Get('negative-evidence')
  listNegativeEvidence() {
    return this.knowledgeService.listNegativeEvidence();
  }

  @Post('negative-evidence')
  recordNegativeEvidence(@Body() rec: Partial<NegativeEvidenceRecord>) {
    return this.knowledgeService.recordNegativeEvidence(rec);
  }

  @Post('kill-switch/trip')
  tripKillSwitch(
    @Body()
    body: {
      subsystem: KillSwitchSubsystem;
      trippedBy: string;
      reason: string;
    },
  ) {
    return this.knowledgeService.tripKillSwitch(body.subsystem, body.trippedBy, body.reason);
  }

  @Post('kill-switch/restore')
  restoreKillSwitch(
    @Body()
    body: {
      subsystem: KillSwitchSubsystem;
      restoredBy: string;
    },
  ) {
    return this.knowledgeService.restoreKillSwitch(body.subsystem, body.restoredBy);
  }
}
