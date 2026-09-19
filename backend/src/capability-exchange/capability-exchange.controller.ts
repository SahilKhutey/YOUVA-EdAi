import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CapabilityAlignmentService } from './capability-alignment.service';
import { CapabilityPassportService } from './capability-passport.service';
import { OpportunityNetworkService } from './opportunity-network.service';
import { OpportunityTrustExchangeService } from './opportunity-trust-exchange.service';
import {
  Opportunity,
  OpportunityType,
  OpportunityStatus,
  PassportCapability,
  PassportExperience,
  ExperienceEvidence,
  OpportunityFraudReport,
  OpportunityAgentAction,
  CapabilityExchangeRequest,
  CapabilityExchangeResult,
} from './n22-types';

@Controller('capability-exchange')
export class CapabilityExchangeController {
  constructor(
    private readonly alignmentService: CapabilityAlignmentService,
    private readonly passportService: CapabilityPassportService,
    private readonly opportunityService: OpportunityNetworkService,
    private readonly trustExchangeService: OpportunityTrustExchangeService,
  ) {}

  // --- Alignment Endpoints ---

  @Post('align')
  calculateAlignment(
    @Body()
    body: {
      learnerId: string;
      learnerCapabilities: PassportCapability[];
      learnerSkills: Array<{ skillId: string; name: string; level: number }>;
      opportunity: Opportunity;
    },
  ) {
    return this.alignmentService.calculateAlignment(
      body.learnerId,
      body.learnerCapabilities,
      body.learnerSkills,
      body.opportunity,
    );
  }

  // --- Capability Passport Endpoints ---

  @Get('passport/:learnerId')
  getPassport(@Param('learnerId') learnerId: string) {
    return this.passportService.getOrCreatePassport(learnerId);
  }

  @Post('passport/:learnerId/capability')
  addCapability(
    @Param('learnerId') learnerId: string,
    @Body() capability: PassportCapability,
  ) {
    return this.passportService.addCapability(learnerId, capability);
  }

  @Post('passport/:learnerId/experience')
  addExperience(
    @Param('learnerId') learnerId: string,
    @Body() experience: PassportExperience,
  ) {
    return this.passportService.addExperience(learnerId, experience);
  }

  @Post('passport/:learnerId/disclosure')
  createDisclosure(
    @Param('learnerId') learnerId: string,
    @Body()
    body: {
      recipientId: string;
      purpose: string;
      capabilityIds: string[];
      ttlMinutes?: number;
    },
  ) {
    return this.passportService.createSelectiveDisclosure(
      learnerId,
      body.recipientId,
      body.purpose,
      body.capabilityIds,
      body.ttlMinutes,
    );
  }

  @Post('passport/verify-disclosure')
  verifyDisclosure(
    @Body() body: { token: string; recipientId: string },
  ) {
    return this.passportService.verifyDisclosureToken(body.token, body.recipientId);
  }

  @Post('passport/:learnerId/revoke-disclosure')
  revokeDisclosure(
    @Param('learnerId') learnerId: string,
    @Body() body: { token: string },
  ) {
    return {
      revoked: this.passportService.revokeDisclosure(learnerId, body.token),
    };
  }

  @Post('evidence')
  submitEvidence(@Body() evidence: Partial<ExperienceEvidence>) {
    return this.passportService.submitExperienceEvidence(evidence);
  }

  @Post('evidence/:evidenceId/validate')
  validateEvidence(
    @Param('evidenceId') evidenceId: string,
    @Body()
    body: {
      status: 'VALIDATED' | 'DISPUTED' | 'REJECTED';
      validatorAuthority: string;
    },
  ) {
    return this.passportService.validateExperienceEvidence(
      evidenceId,
      body.status,
      body.validatorAuthority,
    );
  }

  // --- Opportunity Network Endpoints ---

  @Get('opportunities')
  listOpportunities(
    @Query('type') type?: OpportunityType,
    @Query('isMinorEligible') isMinorEligible?: string,
    @Query('providerId') providerId?: string,
    @Query('status') status?: OpportunityStatus,
    @Query('minFreshness') minFreshness?: string,
    @Query('isSponsored') isSponsored?: string,
  ) {
    return this.opportunityService.listOpportunities({
      type,
      isMinorEligible: isMinorEligible !== undefined ? isMinorEligible === 'true' : undefined,
      providerId,
      status,
      minFreshness: minFreshness ? parseFloat(minFreshness) : undefined,
      isSponsored: isSponsored !== undefined ? isSponsored === 'true' : undefined,
    });
  }

  @Get('opportunities/:id')
  getOpportunity(@Param('id') id: string) {
    return this.opportunityService.getOpportunity(id);
  }

  @Post('opportunities')
  registerOpportunity(@Body() opp: Partial<Opportunity>) {
    return this.opportunityService.registerOpportunity(opp);
  }

  @Patch('opportunities/:id')
  updateOpportunity(
    @Param('id') id: string,
    @Body() patch: Partial<Opportunity>,
  ) {
    return this.opportunityService.updateOpportunity(id, patch);
  }

  // --- Trust & Exchange Endpoints ---

  @Get('trust/:providerId')
  getTrustSignal(@Param('providerId') providerId: string) {
    return this.trustExchangeService.getTrustSignal(providerId);
  }

  @Post('fraud-reports')
  reportFraud(@Body() report: Partial<OpportunityFraudReport>) {
    return this.trustExchangeService.reportFraud(report);
  }

  @Get('fraud-reports')
  listFraudReports(@Query('opportunityId') opportunityId?: string) {
    return this.trustExchangeService.listFraudReports(opportunityId);
  }

  @Post('agent-action')
  authorizeAgentAction(@Body() action: Partial<OpportunityAgentAction>) {
    return this.trustExchangeService.authorizeAgentAction(action);
  }

  @Post('agent-action/:actionId/execute')
  executeAgentAction(@Param('actionId') actionId: string) {
    return this.trustExchangeService.executeAgentAction(actionId);
  }

  @Post('request')
  submitExchangeRequest(@Body() req: Partial<CapabilityExchangeRequest>) {
    return this.trustExchangeService.submitExchangeRequest(req);
  }

  @Patch('request/:exchangeId/status')
  updateExchangeStatus(
    @Param('exchangeId') exchangeId: string,
    @Body()
    body: {
      status: CapabilityExchangeResult['status'];
      actor: string;
    },
  ) {
    return this.trustExchangeService.updateExchangeStatus(
      exchangeId,
      body.status,
      body.actor,
    );
  }

  @Get('requests')
  listExchangeRequests(
    @Query('learnerId') learnerId?: string,
    @Query('opportunityId') opportunityId?: string,
  ) {
    return this.trustExchangeService.listExchangeRequests(learnerId, opportunityId);
  }
}
