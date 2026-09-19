import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CivilizationOperatingSystemService } from './civilization-operating-system.service';
import { EvidenceLedgerNegativeRegistryService } from './evidence-ledger-negative-registry.service';
import { GovernanceKillswitchIncidentService } from './governance-killswitch-incident.service';
import {
  MasterLoopStage,
  ReleaseBlockerCategory,
  EvidenceHierarchyLevel,
  NegativeIncidentType,
  CivilizationKillSwitchSubsystem,
  IncidentLifecycleStage,
} from './n-infinity-types';

@Controller('api/n-infinity')
export class NInfinityController {
  constructor(
    private readonly civilizationOsService: CivilizationOperatingSystemService,
    private readonly evidenceLedgerService: EvidenceLedgerNegativeRegistryService,
    private readonly governanceKillswitchService: GovernanceKillswitchIncidentService,
  ) {}

  // ==========================================
  // 1. MASTER LOOP ENDPOINTS
  // ==========================================

  @Post('loop/init')
  initializeLoop(@Body('learnerId') learnerId: string) {
    return this.civilizationOsService.initializeMasterLoop(learnerId);
  }

  @Post('loop/advance')
  advanceLoop(
    @Body('executionId') executionId: string,
    @Body('nextStage') nextStage: MasterLoopStage,
    @Body('artifactUri') artifactUri?: string,
  ) {
    return this.civilizationOsService.advanceMasterLoopStage(
      executionId,
      nextStage,
      artifactUri,
    );
  }

  @Post('loop/artifact')
  recordLoopArtifact(
    @Body('executionId') executionId: string,
    @Body('stage') stage: MasterLoopStage,
    @Body('uri') uri: string,
  ) {
    return this.civilizationOsService.recordLoopArtifact(executionId, stage, uri);
  }

  @Get('loop/learner/:learnerId')
  listLearnerLoops(@Param('learnerId') learnerId: string) {
    return this.civilizationOsService.listLearnerLoops(learnerId);
  }

  @Get('loop/:executionId')
  getLoopState(@Param('executionId') executionId: string) {
    return this.civilizationOsService.getMasterLoopState(executionId);
  }

  // ==========================================
  // 2. CONTINUOUS RELEASE GATES
  // ==========================================

  @Post('release-gates/evaluate')
  evaluateReleaseGates(
    @Body('releaseTag') releaseTag: string,
    @Body('simulatedFindings')
    simulatedFindings?: Array<{
      category: ReleaseBlockerCategory;
      triggered: boolean;
      details?: string;
    }>,
  ) {
    return this.civilizationOsService.evaluateReleaseGates(
      releaseTag,
      simulatedFindings,
    );
  }

  @Get('release-gates/:releaseTag')
  getReleaseGateEvaluation(@Param('releaseTag') releaseTag: string) {
    return this.civilizationOsService.getReleaseGateEvaluation(releaseTag);
  }

  @Get('release-gates')
  listReleaseGateEvaluations() {
    return this.civilizationOsService.listReleaseGateEvaluations();
  }

  // ==========================================
  // 3. OPERATING SCORECARD
  // ==========================================

  @Post('scorecard')
  recordScorecard(
    @Body()
    scores: {
      learningScore: number;
      capabilityScore: number;
      trustScore: number;
      safetyScore: number;
      sustainabilityScore: number;
    },
  ) {
    return this.civilizationOsService.recordOperatingScorecard(scores);
  }

  @Get('scorecard/latest')
  getLatestScorecard() {
    return this.civilizationOsService.getLatestScorecard();
  }

  @Get('scorecard/history')
  getScorecardHistory() {
    return this.civilizationOsService.getScorecardHistory();
  }

  // ==========================================
  // 4. EVIDENCE HIERARCHY CLAIMS
  // ==========================================

  @Post('evidence/claim')
  submitEvidenceClaim(
    @Body()
    body: {
      claim: string;
      source: string;
      level: EvidenceHierarchyLevel;
      methodology: string;
      populationSize: number;
      confidence: number;
      limitations: string;
      owner: string;
      revalidationDueDate: string;
    },
  ) {
    return this.evidenceLedgerService.submitEvidenceClaim(body);
  }

  @Post('evidence/claim/:claimId/verify')
  verifyEvidenceClaim(
    @Param('claimId') claimId: string,
    @Body('verifier') verifier: string,
    @Body('verified') verified: boolean,
  ) {
    return this.evidenceLedgerService.verifyEvidenceClaim(
      claimId,
      verifier,
      verified,
    );
  }

  @Get('evidence/claim/:claimId')
  getEvidenceClaim(@Param('claimId') claimId: string) {
    return this.evidenceLedgerService.getEvidenceClaim(claimId);
  }

  @Get('evidence/claims')
  getAllEvidenceClaims(@Query('level') level?: EvidenceHierarchyLevel) {
    if (level) {
      return this.evidenceLedgerService.queryClaimsByLevel(level);
    }
    return this.evidenceLedgerService.getAllEvidenceClaims();
  }

  @Get('evidence/revalidation-due')
  checkRevalidationDue() {
    return this.evidenceLedgerService.checkRevalidationRequirements();
  }

  // ==========================================
  // 5. NEGATIVE EVIDENCE LEDGER
  // ==========================================

  @Post('negative-evidence')
  recordNegativeIncident(
    @Body()
    body: {
      incidentType: NegativeIncidentType;
      description: string;
      rootCause: string;
      mitigationPreventativeAction: string;
    },
  ) {
    return this.evidenceLedgerService.recordNegativeIncident(body);
  }

  @Get('negative-evidence/stats')
  getNegativeEvidenceStats() {
    return this.evidenceLedgerService.getNegativeIncidentsCountByType();
  }

  @Get('negative-evidence/:recordId')
  getNegativeIncident(@Param('recordId') recordId: string) {
    return this.evidenceLedgerService.getNegativeIncident(recordId);
  }

  @Get('negative-evidence')
  listNegativeIncidents(@Query('type') type?: NegativeIncidentType) {
    return this.evidenceLedgerService.listNegativeIncidents(type);
  }

  // ==========================================
  // 6. AI AUTHORITY MATRIX & AUDIT LOG
  // ==========================================

  @Post('governance/validate-ai-action')
  @HttpCode(HttpStatus.OK)
  validateAIAction(
    @Body('actionType') actionType: string,
    @Body('payload') payload?: any,
  ) {
    return this.governanceKillswitchService.validateAIAction(actionType, payload);
  }

  @Get('governance/ai-audit-log')
  getAIAuditLog() {
    return this.governanceKillswitchService.getAIAuditLog();
  }

  // ==========================================
  // 7. CIVILIZATION KILL SWITCH MATRIX
  // ==========================================

  @Get('kill-switches')
  getAllKillSwitches() {
    return this.governanceKillswitchService.getAllKillSwitches();
  }

  @Get('kill-switches/:subsystem')
  getKillSwitchStatus(
    @Param('subsystem') subsystem: CivilizationKillSwitchSubsystem,
  ) {
    return this.governanceKillswitchService.getKillSwitchStatus(subsystem);
  }

  @Post('kill-switches/:subsystem/trip')
  tripKillSwitch(
    @Param('subsystem') subsystem: CivilizationKillSwitchSubsystem,
    @Body('trippedBy') trippedBy: string,
    @Body('reason') reason: string,
  ) {
    return this.governanceKillswitchService.tripKillSwitch(
      subsystem,
      trippedBy,
      reason,
    );
  }

  @Post('kill-switches/:subsystem/reset')
  resetKillSwitch(
    @Param('subsystem') subsystem: CivilizationKillSwitchSubsystem,
    @Body('resetBy') resetBy: string,
    @Body('authorizationToken') authorizationToken: string,
  ) {
    return this.governanceKillswitchService.resetKillSwitch(
      subsystem,
      resetBy,
      authorizationToken,
    );
  }

  @Post('kill-switches/global-emergency')
  tripGlobalEmergency(
    @Body('trippedBy') trippedBy: string,
    @Body('reason') reason: string,
  ) {
    return this.governanceKillswitchService.tripGlobalEmergency(
      trippedBy,
      reason,
    );
  }

  // ==========================================
  // 8. INCIDENT MANAGEMENT LIFECYCLE
  // ==========================================

  @Post('incidents')
  declareIncident(
    @Body('severity') severity: 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4',
    @Body('title') title: string,
    @Body('declaredBy') declaredBy: string,
    @Body('notes') notes?: string,
  ) {
    return this.governanceKillswitchService.declareIncident(
      severity,
      title,
      declaredBy,
      notes,
    );
  }

  @Post('incidents/:incidentId/advance')
  advanceIncident(
    @Param('incidentId') incidentId: string,
    @Body('nextStage') nextStage: IncidentLifecycleStage,
    @Body('actor') actor: string,
    @Body('notes') notes?: string,
  ) {
    return this.governanceKillswitchService.advanceIncidentStage(
      incidentId,
      nextStage,
      actor,
      notes,
    );
  }

  @Post('incidents/:incidentId/postmortem')
  attachPostmortem(
    @Param('incidentId') incidentId: string,
    @Body('postmortemUri') postmortemUri: string,
    @Body('systemicActionItem') systemicActionItem: string,
  ) {
    return this.governanceKillswitchService.attachPostmortem(
      incidentId,
      postmortemUri,
      systemicActionItem,
    );
  }

  @Get('incidents/:incidentId')
  getIncident(@Param('incidentId') incidentId: string) {
    return this.governanceKillswitchService.getIncident(incidentId);
  }

  @Get('incidents')
  listIncidents(@Query('activeOnly') activeOnly?: string) {
    if (activeOnly === 'true') {
      return this.governanceKillswitchService.listActiveIncidents();
    }
    return this.governanceKillswitchService.listAllIncidents();
  }
}
