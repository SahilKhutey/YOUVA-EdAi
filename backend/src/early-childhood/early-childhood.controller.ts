import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AgePolicyService } from './age-policy.service';
import { PreschoolLearningService } from './preschool-learning.service';
import { ElementaryLearningService } from './elementary-learning.service';
import { PhysicalWorldLearningService } from './physical-world-learning.service';
import { ChildVoiceTutorService } from './child-voice-tutor.service';
import { ChildSafetyEngineService } from './child-safety-engine.service';
import { ParentConsentService } from './parent-consent.service';
import { ParentCoPilotService } from './parent-copilot.service';
import { ParentTeacherCoordinationService } from './parent-teacher-coordination.service';
import { ChildContentGovernanceService } from './child-content-governance.service';
import { DualPilotService } from './dual-pilot.service';
import { AgeBand, DeviceMode, ChildSafetyCategory, ChildSafetySeverity } from './early-childhood-types';

@Controller('api/v1/early-childhood')
export class EarlyChildhoodController {
  constructor(
    private readonly agePolicyService: AgePolicyService,
    private readonly preschoolService: PreschoolLearningService,
    private readonly elementaryService: ElementaryLearningService,
    private readonly physicalService: PhysicalWorldLearningService,
    private readonly voiceService: ChildVoiceTutorService,
    private readonly safetyEngine: ChildSafetyEngineService,
    private readonly consentService: ParentConsentService,
    private readonly parentCoPilot: ParentCoPilotService,
    private readonly coordinationService: ParentTeacherCoordinationService,
    private readonly contentGovernance: ChildContentGovernanceService,
    private readonly dualPilotService: DualPilotService
  ) {}

  // --- Age Experience Policy ---
  @Get('age-policy/:band')
  getAgePolicy(@Param('band') band: string) {
    return this.agePolicyService.getPolicy(band.toUpperCase() as AgeBand);
  }

  // --- Pre-School Learning ---
  @Get('preschool/activities')
  getPreschoolActivities(@Query('domain') domain?: string) {
    return this.preschoolService.listActivities(domain?.toUpperCase());
  }

  @Get('preschool/story/start')
  startStory(@Query('learnerId') learnerId?: string, @Query('title') title?: string) {
    return this.preschoolService.startInteractiveStory(learnerId || 'guest-learner', title);
  }

  @Post('preschool/story/advance')
  advanceStory(@Body() body: { storyId: string; choiceId: string }) {
    return this.preschoolService.advanceStory(body.storyId, body.choiceId);
  }

  @Post('preschool/phonics/evaluate')
  evaluatePhonics(@Body() body: { spokenWord: string; targetPhoneme: string }) {
    return this.preschoolService.evaluatePhonicsSafari(body.spokenWord, body.targetPhoneme);
  }

  @Post('preschool/rhymes/evaluate')
  evaluateRhyme(@Body() body: { wordA: string; wordB: string }) {
    return this.preschoolService.evaluateRhyme(body.wordA, body.wordB);
  }

  @Post('preschool/counting/evaluate')
  evaluateCounting(@Body() body: { targetCount: number; countedItems: number }) {
    return this.preschoolService.evaluateCounting(body.targetCount, body.countedItems);
  }

  // --- Elementary Learning ---
  @Get('elementary/lessons')
  getElementaryLessons(@Query('subject') subject?: string) {
    return this.elementaryService.listLessons(subject?.toUpperCase());
  }

  @Post('elementary/challenge/evaluate')
  evaluateElementary(@Body() body: { lessonId: string; submittedAnswer: string }) {
    return this.elementaryService.evaluateChallenge(body.lessonId, body.submittedAnswer);
  }

  // --- Physical-World Tasks ---
  @Get('physical-world/random')
  getRandomPhysicalTask() {
    return this.physicalService.getRandomPhysicalTask();
  }

  @Post('physical-world/verify')
  verifyPhysicalTask(
    @Body()
    body: {
      learnerId: string;
      taskId: string;
      confirmedBy: 'PARENT' | 'CHILD_VOICE' | 'TEACHER';
      childVerbalResponse?: string;
      notes?: string;
    }
  ) {
    return this.physicalService.recordTaskCompletion({
      learnerId: body.learnerId,
      taskId: body.taskId,
      confirmedBy: body.confirmedBy,
      childVerbalResponse: body.childVerbalResponse,
      notes: body.notes,
    });
  }

  // --- Child Voice Tutor ---
  @Post('voice/process-turn')
  processVoiceTurn(
    @Body()
    body: {
      learnerId: string;
      transcript: string;
      acousticConfidence: number;
      currentConceptPrompt: string;
    }
  ) {
    return this.voiceService.processVoiceUtterance({
      learnerId: body.learnerId,
      transcript: body.transcript,
      acousticConfidence: body.acousticConfidence,
      currentConceptPrompt: body.currentConceptPrompt,
    });
  }

  // --- Child Safety Engine ---
  @Post('safety/evaluate')
  evaluateSafety(
    @Body()
    body: {
      learnerId: string;
      tenantId: string;
      inputContent: string;
    }
  ) {
    return this.safetyEngine.evaluateChildInput({
      learnerId: body.learnerId,
      tenantId: body.tenantId,
      inputContent: body.inputContent,
    });
  }

  @Get('safety/incidents')
  getIncidents(@Query('tenantId') tenantId?: string) {
    return this.safetyEngine.listIncidents(tenantId);
  }

  @Post('safety/resolve-incident')
  resolveIncident(
    @Body()
    body: {
      incidentId: string;
      actorId: string;
      actorType: 'HUMAN' | 'AI';
      rationale: string;
      signature: string;
    }
  ) {
    return this.safetyEngine.resolveIncident({
      incidentId: body.incidentId,
      actorId: body.actorId,
      actorType: body.actorType,
      rationale: body.rationale,
      signature: body.signature,
    });
  }

  // --- Parent Consent ---
  @Post('consent/request')
  requestConsent(
    @Body()
    body: {
      learnerId: string;
      parentId: string;
      tenantId: string;
      scopes: string[];
      jurisdiction?: string;
    }
  ) {
    return this.consentService.requestConsent({
      learnerId: body.learnerId,
      parentId: body.parentId,
      tenantId: body.tenantId,
      scopes: body.scopes,
      jurisdiction: body.jurisdiction,
    });
  }

  @Post('consent/verify')
  verifyConsent(
    @Body()
    body: {
      consentId: string;
      verifiedBy: string;
      verificationProof: string;
    }
  ) {
    return this.consentService.verifyAndActivateConsent(body.consentId, body.verifiedBy, body.verificationProof);
  }

  @Post('consent/withdraw')
  withdrawConsent(
    @Body()
    body: {
      consentId: string;
      parentId: string;
      reason: string;
    }
  ) {
    return this.consentService.withdrawConsent(body.consentId, body.parentId, body.reason);
  }

  @Get('consent/learner/:learnerId')
  getLearnerConsent(@Param('learnerId') learnerId: string) {
    return this.consentService.getLearnerActiveConsent(learnerId);
  }

  // --- Parent Co-Pilot ---
  @Post('parent/copilot/summary')
  getParentSummary(
    @Body()
    body: {
      learnerId: string;
      learnerName: string;
      internalMasteryScore: number;
      totalMinutesUsed: number;
      completedActivitiesCount: number;
      safetyAlertsCount?: number;
      recentDomain: string;
    }
  ) {
    return this.parentCoPilot.generateParentSummary(body);
  }

  // --- Parent-Teacher Coordination & Shared Devices ---
  @Post('coordination/notes')
  createCoordinationNote(
    @Body()
    body: {
      learnerId: string;
      teacherId: string;
      parentId: string;
      subject: string;
      message: string;
      tags?: string[];
    }
  ) {
    return this.coordinationService.createNote(
      body.learnerId,
      body.teacherId,
      body.parentId,
      body.subject,
      body.message,
      body.tags
    );
  }

  @Get('coordination/notes/learner/:learnerId')
  getNotesForLearner(@Param('learnerId') learnerId: string) {
    return this.coordinationService.getNotesForLearner(learnerId);
  }

  @Post('device/switch-mode')
  switchDeviceMode(@Body() body: { deviceId: string; targetMode: DeviceMode; adultPin?: string }) {
    return this.coordinationService.switchMode(body.deviceId, body.targetMode, body.adultPin);
  }

  @Post('device/switch-learner')
  switchLearner(@Body() body: { deviceId: string; fromLearnerId: string; toLearnerId: string }) {
    return this.coordinationService.switchLearnerOnSharedDevice(
      body.deviceId,
      body.fromLearnerId,
      body.toLearnerId
    );
  }

  // --- Content Governance ---
  @Post('content/assess')
  assessContent(
    @Body()
    body: {
      contentId: string;
      contentType: 'STATIC_ASSET' | 'TEMPLATE_ADAPTIVE' | 'GENERATIVE_MULTIMODAL';
      metadata?: any;
    }
  ) {
    return this.contentGovernance.assessContentRisk(body.contentId, body.contentType, body.metadata || {});
  }

  @Post('content/approve')
  approveContent(@Body() body: { contentId: string; reviewerId: string; reviewerRole: string }) {
    return this.contentGovernance.approveContent(body.contentId, body.reviewerId, body.reviewerRole);
  }

  // --- Dual Pilot ---
  @Get('pilot/metrics/:pilotId')
  getPilotMetrics(@Param('pilotId') pilotId: string) {
    return this.dualPilotService.getPilotMetrics(pilotId.toUpperCase() as any);
  }

  @Get('pilot/go-no-go/:pilotId')
  getPilotGoNoGo(@Param('pilotId') pilotId: string) {
    return this.dualPilotService.evaluatePilotGoNoGo(pilotId.toUpperCase() as any);
  }
}
