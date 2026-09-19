import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
} from '@nestjs/common';
import { SkillsGraphService } from './skills-graph.service';
import { EvidenceGraphService } from './evidence-graph.service';
import { CredentialLifecycleService } from './credential-lifecycle.service';
import { CredentialVerificationGatewayService } from './credential-verification-gateway.service';
import { CredentialWalletPassportService } from './credential-wallet-passport.service';
import {
  Skill,
  SkillStatus,
  SkillEvidence,
  CredentialType,
  CredentialIssuer,
  SelectiveDisclosureRequest,
} from './n19-types';

@Controller('skills-credential')
export class SkillsCredentialNetworkController {
  constructor(
    private readonly skillsService: SkillsGraphService,
    private readonly evidenceService: EvidenceGraphService,
    private readonly lifecycleService: CredentialLifecycleService,
    private readonly verificationGateway: CredentialVerificationGatewayService,
    private readonly walletService: CredentialWalletPassportService,
  ) {}

  // --- SKILLS GRAPH ENDPOINTS ---

  @Get('skills')
  getSkills() {
    return this.skillsService.getSkills();
  }

  @Get('skills/:id')
  getSkill(@Param('id') id: string) {
    return this.skillsService.getSkill(id);
  }

  @Post('skills')
  registerSkill(@Body() skill: Skill) {
    return this.skillsService.registerSkill(skill);
  }

  @Patch('skills/:id/version')
  upgradeSkillVersion(
    @Param('id') id: string,
    @Body() body: { newVersion: string; description: string; requirements?: string[] },
  ) {
    return this.skillsService.upgradeSkillVersion(
      id,
      body.newVersion,
      body.description,
      body.requirements,
    );
  }

  @Get('skills/crosswalks/evaluate')
  evaluateSkillEquivalence(
    @Query('sourceSkillId') sourceSkillId: string,
    @Query('targetSkillId') targetSkillId: string,
    @Query('sourceTaxonomy') sourceTaxonomy?: string,
    @Query('targetTaxonomy') targetTaxonomy?: string,
    @Query('similarityHint') similarityHint?: string,
  ) {
    return this.skillsService.evaluateSkillEquivalence(
      sourceSkillId,
      targetSkillId,
      sourceTaxonomy,
      targetTaxonomy,
      similarityHint ? parseFloat(similarityHint) : undefined,
    );
  }

  // --- EVIDENCE GRAPH ENDPOINTS ---

  @Get('evidence/learner/:learnerId')
  getEvidenceByLearner(@Param('learnerId') learnerId: string) {
    return this.evidenceService.getEvidenceByLearner(learnerId);
  }

  @Post('evidence')
  recordEvidence(
    @Body()
    evidence: Omit<SkillEvidence, 'evidenceId' | 'provenanceHash'> & {
      surveillanceUsed?: boolean;
      emotionDetectionUsed?: boolean;
    },
  ) {
    return this.evidenceService.recordEvidence(evidence);
  }

  // --- CREDENTIAL LIFECYCLE & ISSUERS ---

  @Get('issuers')
  getIssuers() {
    return this.lifecycleService.getIssuers();
  }

  @Post('issuers')
  registerIssuer(@Body() issuer: CredentialIssuer) {
    return this.lifecycleService.registerIssuer(issuer);
  }

  @Get('credentials')
  getCredentials() {
    return this.lifecycleService.getCredentials();
  }

  @Get('credentials/holder/:holderId')
  getCredentialsByHolder(@Param('holderId') holderId: string) {
    return this.lifecycleService.getCredentialsByHolder(holderId);
  }

  @Post('credentials/issue')
  issueCredential(
    @Body()
    body: {
      holderId: string;
      issuerId: string;
      credentialType: CredentialType;
      skills: string[];
      evidenceReferences: string[];
      authorizedByHumanId?: string;
      authorizationTicketId?: string;
      isAiAutonomousAttempt?: boolean;
      expiresInDays?: number;
    },
  ) {
    return this.lifecycleService.issueCredential(body);
  }

  @Post('credentials/:id/revoke')
  revokeCredential(
    @Param('id') id: string,
    @Body() body: { reason: any; authorizedBy: string },
  ) {
    return this.lifecycleService.revokeCredential(id, body.reason, body.authorizedBy);
  }

  @Get('credentials/evidence-impact/:evidenceId')
  analyzeEvidenceInvalidationImpact(@Param('evidenceId') evidenceId: string) {
    return this.lifecycleService.analyzeEvidenceInvalidationImpact(evidenceId);
  }

  // --- VERIFICATION GATEWAY ENDPOINTS ---

  @Get('verify/:credentialId')
  verifyCredential(
    @Param('credentialId') credentialId: string,
    @Query('simulatedOutage') simulatedOutage?: string,
  ) {
    return this.verificationGateway.verifyCredential(
      credentialId,
      simulatedOutage === 'true',
    );
  }

  @Get('export/openbadge/:credentialId')
  exportOpenBadge(@Param('credentialId') credentialId: string) {
    return this.verificationGateway.exportOpenBadge(credentialId);
  }

  @Get('export/w3c-vc/:credentialId')
  exportW3cVerifiableCredential(@Param('credentialId') credentialId: string) {
    return this.verificationGateway.exportW3cVerifiableCredential(credentialId);
  }

  // --- PASSPORT & SELECTIVE DISCLOSURE ---

  @Get('passport/:learnerId')
  getSkillsPassport(@Param('learnerId') learnerId: string) {
    return this.walletService.getSkillsPassport(learnerId);
  }

  @Post('passport/share')
  createSelectiveDisclosureShare(@Body() request: SelectiveDisclosureRequest) {
    return this.walletService.createSelectiveDisclosureShare(request);
  }

  @Get('passport/share/:token')
  getSharePresentation(@Param('token') token: string) {
    return this.walletService.getSharePresentation(token);
  }

  // --- INFLATION RISK MONITOR ---

  @Post('governance/inflation-check')
  evaluateIssuerInflationRisk(
    @Body()
    body: {
      issuerId: string;
      passRate: number;
      issuanceVelocityPerHour: number;
      minimalEvidenceRatio: number;
    },
  ) {
    return this.walletService.evaluateIssuerInflationRisk(
      body.issuerId,
      body.passRate,
      body.issuanceVelocityPerHour,
      body.minimalEvidenceRatio,
    );
  }

  @Get('governance/inflation-signals')
  getInflationSignals() {
    return this.walletService.getInflationSignals();
  }
}
