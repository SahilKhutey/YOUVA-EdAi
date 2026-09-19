import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
} from '@nestjs/common';
import { JurisdictionEngineService } from './jurisdiction-engine.service';
import { InstitutionalPolicyEngineService } from './institutional-policy-engine.service';
import { CurriculumMappingService } from './curriculum-mapping.service';
import { CredentialNetworkService } from './credential-network.service';
import { IntegrationGatewayService } from './integration-gateway.service';
import { InstitutionalTrustService } from './institutional-trust.service';
import {
  JurisdictionProfile,
  InstitutionalPolicy,
  InstitutionalTenantScope,
  CurriculumStandard,
  CurriculumMapping,
  SelectiveDisclosureRequest,
  ExternalEvidencePayload,
  ProductClaim,
  GovernanceDebtRecord,
  InstitutionalRiskRecord,
} from './n16-types';

@Controller('institutional-governance')
export class InstitutionalGovernanceController {
  constructor(
    private readonly jurisdictionEngine: JurisdictionEngineService,
    private readonly policyEngine: InstitutionalPolicyEngineService,
    private readonly curriculumMapping: CurriculumMappingService,
    private readonly credentialNetwork: CredentialNetworkService,
    private readonly integrationGateway: IntegrationGatewayService,
    private readonly trustService: InstitutionalTrustService
  ) {}

  // --- 1. Jurisdictions ---

  @Get('jurisdictions')
  public listJurisdictions() {
    return this.jurisdictionEngine.listJurisdictions();
  }

  @Get('jurisdictions/:id')
  public getJurisdiction(@Param('id') id: string) {
    return this.jurisdictionEngine.getJurisdiction(id);
  }

  @Post('jurisdictions')
  public registerJurisdiction(@Body() body: Omit<JurisdictionProfile, 'createdAt' | 'updatedAt' | 'status'>) {
    return this.jurisdictionEngine.registerJurisdiction(body);
  }

  @Get('jurisdictions/:id/activation')
  public getActivationStatus(@Param('id') id: string) {
    return this.jurisdictionEngine.getActivationStatus(id);
  }

  @Post('jurisdictions/:id/activate-step')
  public advanceActivationStep(
    @Param('id') id: string,
    @Body() body: { stepNumber: number; reviewerId: string; evidenceUrl: string; passed: boolean; notes?: string }
  ) {
    return this.jurisdictionEngine.advanceActivationStep({
      jurisdictionId: id,
      ...body,
    });
  }

  @Post('jurisdictions/:id/suspend')
  public suspendJurisdiction(@Param('id') id: string, @Body('reason') reason: string) {
    return this.jurisdictionEngine.suspendJurisdiction(id, reason);
  }

  @Post('jurisdictions/:id/reinstate')
  public reinstateJurisdiction(@Param('id') id: string, @Body('reviewerId') reviewerId: string) {
    return this.jurisdictionEngine.reinstateJurisdiction(id, reviewerId);
  }

  // --- 2. Policies ---

  @Post('policies')
  public configurePolicy(@Body() policy: InstitutionalPolicy) {
    return this.policyEngine.configurePolicy(policy);
  }

  @Post('policies/resolve')
  public resolvePolicy(@Body() body: { scope: InstitutionalTenantScope; jurisdictionId?: string }) {
    return this.policyEngine.resolveEffectivePolicy(body.scope, body.jurisdictionId);
  }

  @Post('policies/freeze')
  public setFreeze(
    @Body()
    body: {
      scopeLevel: 'PLATFORM' | 'JURISDICTION' | 'ORGANIZATION' | 'INSTITUTION' | 'CLASS';
      targetId: string;
      active: boolean;
      reason: string;
      operatorId: string;
    }
  ) {
    return {
      freezeActive: this.policyEngine.setPolicyFreeze(body),
    };
  }

  // --- 3. Curriculum Mapping ---

  @Get('curriculum/concepts/:id/mappings')
  public getMappingsForConcept(@Param('id') id: string) {
    return this.curriculumMapping.getMappingsForConcept(id);
  }

  @Post('curriculum/standards')
  public registerStandard(@Body() standard: CurriculumStandard) {
    return this.curriculumMapping.registerStandard(standard);
  }

  @Post('curriculum/mappings')
  public registerMapping(
    @Body() mapping: Omit<CurriculumMapping, 'mappingId' | 'createdAt' | 'updatedAt' | 'status'>
  ) {
    return this.curriculumMapping.registerMapping(mapping);
  }

  // --- 4. Credentials ---

  @Post('credentials/attestation')
  public issueAttestation(
    @Body()
    body: {
      learnerId: string;
      issuerId: string;
      skillCode: string;
      competencyLevel: string;
      evidenceHashes: string[];
    }
  ) {
    return this.credentialNetwork.issueAttestation(body);
  }

  @Post('credentials/verify-selective')
  public verifySelectiveDisclosure(@Body() request: SelectiveDisclosureRequest) {
    return this.credentialNetwork.verifySelectiveDisclosure(request);
  }

  @Post('credentials/:id/revoke')
  public revokeAttestation(
    @Param('id') id: string,
    @Body() body: { reason: string; reviewerId: string }
  ) {
    return this.credentialNetwork.revokeAttestation(id, body.reason, body.reviewerId);
  }

  // --- 5. Integration Gateway ---

  @Post('integrations/adapters')
  public registerAdapter(
    @Body()
    body: {
      systemId: string;
      systemType: string;
      tenantId: string;
      sharedSecret: string;
    }
  ) {
    this.integrationGateway.registerAdapter(body);
    return { registered: true, systemId: body.systemId };
  }

  @Post('integrations/evidence/ingest')
  public ingestExternalEvidence(
    @Body() payload: ExternalEvidencePayload,
    @Headers('x-youva-signature') signature: string,
    @Headers('x-youva-timestamp') timestamp: string
  ) {
    const timestampHeader = parseInt(timestamp, 10) || Math.floor(Date.now() / 1000);
    return this.integrationGateway.ingestExternalEvidence(payload, signature || '', timestampHeader);
  }

  // --- 6. Institutional Trust & Governance Debt ---

  @Get('trust/claims')
  public listClaims() {
    return this.trustService.listClaims();
  }

  @Post('trust/claims')
  public registerClaim(@Body() claim: Omit<ProductClaim, 'status'>) {
    return this.trustService.registerClaim(claim);
  }

  @Get('trust/artifacts')
  public listTrustArtifacts() {
    return this.trustService.listTrustArtifacts();
  }

  @Get('trust/subprocessors')
  public listSubprocessors() {
    return this.trustService.listSubprocessors();
  }

  @Get('trust/acceptance-matrix')
  public evaluateAcceptanceMatrix() {
    return this.trustService.evaluateAcceptanceMatrix();
  }

  @Get('analytics/executive/:tenantId')
  public getExecutiveAnalytics(@Param('tenantId') tenantId: string) {
    return this.trustService.getExecutiveAnalytics(tenantId);
  }

  @Get('debt')
  public getGovernanceDebtStatus() {
    return {
      debtIndex: this.trustService.calculateGovernanceDebtIndex(),
      featureFreezeActive: this.trustService.isFeatureFreezeActive(),
    };
  }

  @Post('debt')
  public recordGovernanceDebt(
    @Body() debt: Omit<GovernanceDebtRecord, 'debtId' | 'createdAt' | 'remediationStatus'>
  ) {
    return this.trustService.recordGovernanceDebt(debt);
  }

  @Get('risks')
  public listRisks() {
    return this.trustService.listRisks();
  }

  @Post('risks')
  public recordRisk(@Body() risk: Omit<InstitutionalRiskRecord, 'riskId' | 'riskScore'>) {
    return this.trustService.recordRisk(risk);
  }
}
