import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { SkillTaxonomyService } from './skill-taxonomy.service';
import { LearningEvidenceService } from './learning-evidence.service';
import { ProjectAssessmentService } from './project-assessment.service';
import { TeacherRubricService } from './teacher-rubric.service';
import { CredentialPolicyService } from './credential-policy.service';
import { CredentialLifecycleService } from './credential-lifecycle.service';
import { OpenBadgesService } from './open-badges.service';
import { VerifiableCredentialsService } from './verifiable-credentials.service';
import { SkillsPassportService } from './skills-passport.service';
import { CareerPathwaysService } from './career-pathways.service';
import { HighSchoolPilotService } from './highschool-pilot.service';
import {
  LearningEvidenceType,
  EvidenceQualityLevel,
  AIAssistanceDisclosure,
  RubricCriterionScore,
  RevocationReason,
} from './credential-types';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    sub?: string;
    userId?: string;
    tenantId?: string;
    role?: string;
  };
}

@Controller(['api/v1/n12/credentials', 'api/v1/highschool'])
export class CredentialsController {
  constructor(
    private readonly taxonomyService: SkillTaxonomyService,
    private readonly evidenceService: LearningEvidenceService,
    private readonly projectService: ProjectAssessmentService,
    private readonly rubricService: TeacherRubricService,
    private readonly policyService: CredentialPolicyService,
    private readonly lifecycleService: CredentialLifecycleService,
    private readonly badgeService: OpenBadgesService,
    private readonly vcService: VerifiableCredentialsService,
    private readonly passportService: SkillsPassportService,
    private readonly pathwaysService: CareerPathwaysService,
    private readonly pilotService: HighSchoolPilotService,
  ) {}

  // --- Skill Taxonomy ---
  @Get('skills/taxonomy')
  getTaxonomy(@Query('domain') domain?: string, @Query('level') level?: string) {
    return this.taxonomyService.listSkills({ domain, level });
  }

  @Get('skills/taxonomy/:skillId')
  getSkill(@Param('skillId') skillId: string) {
    return this.taxonomyService.getSkill(skillId);
  }

  // --- Learning Evidence ---
  @Post('evidence/record')
  recordEvidence(
    @Body()
    body: {
      learnerId: string;
      tenantId?: string;
      skillId: string;
      evidenceType: LearningEvidenceType;
      qualityLevel: EvidenceQualityLevel;
      score?: number;
      rubricVersion?: string;
      sourceActivityId?: string;
      verifiedBy?: string;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = body.tenantId || req.user?.tenantId || 'default-tenant';
    return this.evidenceService.recordEvidence({
      ...body,
      tenantId,
    });
  }

  @Get('evidence/learner/:learnerId')
  getLearnerEvidence(
    @Param('learnerId') learnerId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId;
    return this.evidenceService.getLearnerEvidence(learnerId, tenantId);
  }

  @Get('evidence/learner/:learnerId/summary/:skillId')
  getSkillSummary(
    @Param('learnerId') learnerId: string,
    @Param('skillId') skillId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId;
    return this.evidenceService.aggregateSkillEvidence(learnerId, skillId, tenantId);
  }

  // --- Projects & AI Assistance Disclosure ---
  @Post('projects/submit')
  submitProject(
    @Body()
    body: {
      learnerId: string;
      tenantId?: string;
      title: string;
      domain: string;
      problemStatement: string;
      artifactUrl: string;
      repositoryUrl?: string;
      aiDisclosure: AIAssistanceDisclosure;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = body.tenantId || req.user?.tenantId || 'default-tenant';
    return this.projectService.submitProject({
      ...body,
      tenantId,
    });
  }

  @Get('projects/:projectId')
  getProject(@Param('projectId') projectId: string) {
    return this.projectService.getProject(projectId);
  }

  @Post('projects/:projectId/ai-rubric-suggestion')
  getAiRubricSuggestion(@Param('projectId') projectId: string) {
    const project = this.projectService.getProject(projectId);
    return this.rubricService.generateAiRubricSuggestion(project);
  }

  @Post('projects/:projectId/evaluate')
  evaluateProject(
    @Param('projectId') projectId: string,
    @Body()
    body: {
      evaluatorId: string;
      criteriaScores: RubricCriterionScore[];
      overallComments: string;
      associatedSkillId: string;
    },
  ) {
    return this.rubricService.evaluateProject({
      projectId,
      evaluatorId: body.evaluatorId,
      criteriaScores: body.criteriaScores,
      overallComments: body.overallComments,
      associatedSkillId: body.associatedSkillId,
    });
  }

  // --- Portfolio ---
  @Post('portfolio/create')
  createPortfolioArtifact(
    @Body()
    body: {
      learnerId: string;
      tenantId?: string;
      title: string;
      description: string;
      skills: string[];
      evidenceIds: string[];
    },
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = body.tenantId || req.user?.tenantId || 'default-tenant';
    return this.projectService.createPortfolioArtifact({
      ...body,
      tenantId,
    });
  }

  @Post('portfolio/:artifactId/share')
  sharePortfolioArtifact(
    @Param('artifactId') artifactId: string,
    @Body() body: { learnerId: string; ttlHours?: number },
  ) {
    return this.projectService.generateShareLink(artifactId, body.learnerId, body.ttlHours);
  }

  // --- Credential Policy & Lifecycle ---
  @Get('policies')
  listPolicies() {
    return this.policyService.listPolicies();
  }

  @Get('policies/:policyId/eligibility/:learnerId')
  checkEligibility(
    @Param('policyId') policyId: string,
    @Param('learnerId') learnerId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId;
    return this.policyService.evaluateEligibility(policyId, learnerId, tenantId);
  }

  @Post('request')
  requestCredential(
    @Body()
    body: {
      policyId: string;
      learnerId: string;
      tenantId?: string;
      clientRequestId?: string;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = body.tenantId || req.user?.tenantId || 'default-tenant';
    return this.lifecycleService.requestCredential({
      policyId: body.policyId,
      learnerId: body.learnerId,
      tenantId,
      clientRequestId: body.clientRequestId,
    });
  }

  @Post(':credentialId/authorize')
  authorizeCredential(
    @Param('credentialId') credentialId: string,
    @Body() body: { authorizedBy: string; decision: 'APPROVE' | 'REJECT'; notes?: string },
  ) {
    return this.lifecycleService.authorizeCredential(
      credentialId,
      body.authorizedBy,
      body.decision,
      body.notes,
    );
  }

  @Post(':credentialId/issue')
  issueCredential(@Param('credentialId') credentialId: string) {
    return this.lifecycleService.issueCredential(credentialId);
  }

  @Post(':credentialId/revoke')
  revokeCredential(
    @Param('credentialId') credentialId: string,
    @Body() body: { revokedBy: string; reason: RevocationReason; notes?: string },
  ) {
    return this.lifecycleService.revokeCredential(
      credentialId,
      body.revokedBy,
      body.reason,
      body.notes,
    );
  }

  // --- Skills Passport ---
  @Get('learner/:learnerId/passport')
  getPassport(
    @Param('learnerId') learnerId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.passportService.generatePassport(learnerId, tenantId);
  }

  // --- Open Badges & W3C VC Exporters ---
  @Get(':credentialId/open-badge')
  getOpenBadge(@Param('credentialId') credentialId: string) {
    const cred = this.lifecycleService.getCredential(credentialId);
    const policy = this.policyService.getPolicy(cred.policyId);
    return this.badgeService.generateBadgeAssertion(cred, policy);
  }

  @Get(':credentialId/w3c-vc')
  getW3CVerifiableCredential(@Param('credentialId') credentialId: string) {
    const cred = this.lifecycleService.getCredential(credentialId);
    const policy = this.policyService.getPolicy(cred.policyId);
    const evidences = cred.evidenceIds.map(id => this.evidenceService.getEvidence(id));
    return this.vcService.issueVerifiableCredential(cred, policy, evidences);
  }

  // --- Career Pathways ---
  @Get('pathways/explore/:learnerId')
  exploreCareerPathways(
    @Param('learnerId') learnerId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId;
    return this.pathwaysService.explorePathways(learnerId, tenantId);
  }

  // --- Second Controlled Pilot ---
  @Post('pilot/execute')
  executePilot(@Body() body: { tenantId?: string }) {
    return this.pilotService.executePilotEvaluation(body.tenantId);
  }
}
