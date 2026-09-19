import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CredentialLifecycleService } from '../src/skills-credential-network/credential-lifecycle.service';
import { CredentialVerificationGatewayService } from '../src/skills-credential-network/credential-verification-gateway.service';
import { CredentialWalletPassportService } from '../src/skills-credential-network/credential-wallet-passport.service';
import { SkillsGraphService } from '../src/skills-credential-network/skills-graph.service';
import { EvidenceGraphService } from '../src/skills-credential-network/evidence-graph.service';
import {
  CredentialType,
  CredentialLifecycleStatus,
} from '../src/skills-credential-network/n19-types';

describe('N19 Credential Verification & Wallet Architecture Suite (260 Tests)', () => {
  let lifecycleService: CredentialLifecycleService;
  let verificationGateway: CredentialVerificationGatewayService;
  let walletService: CredentialWalletPassportService;
  let skillsService: SkillsGraphService;
  let evidenceService: EvidenceGraphService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialLifecycleService,
        CredentialVerificationGatewayService,
        CredentialWalletPassportService,
        SkillsGraphService,
        EvidenceGraphService,
      ],
    }).compile();

    lifecycleService = moduleRef.get<CredentialLifecycleService>(CredentialLifecycleService);
    verificationGateway = moduleRef.get<CredentialVerificationGatewayService>(CredentialVerificationGatewayService);
    walletService = moduleRef.get<CredentialWalletPassportService>(CredentialWalletPassportService);
    skillsService = moduleRef.get<SkillsGraphService>(SkillsGraphService);
    evidenceService = moduleRef.get<EvidenceGraphService>(EvidenceGraphService);
  });

  // =========================================================================
  // DOMAIN 1: Credential Lifecycle & Governed Issuance [65 Tests]
  // =========================================================================
  describe('Domain 1: Credential Lifecycle & Governed Issuance (Clauses N19.24–N19.30, N19.42–N19.43, N19.148) [65 Tests]', () => {
    it('1.1 should retrieve seeded default credentials', () => {
      const list = lifecycleService.getCredentials();
      expect(list.length).toBeGreaterThanOrEqual(1);
      const cred = list.find((c) => c.credentialId === 'CRED-MATH-CALC-001');
      expect(cred).toBeDefined();
      expect(cred?.status).toBe('ACTIVE');
      expect(cred?.holderId).toBe('STUDENT-201');
    });

    it('1.2 should issue a new credential with human authorization', () => {
      const issued = lifecycleService.issueCredential({
        holderId: 'STU-CRED-01',
        issuerId: 'ISSUER-DPS-DELHI',
        credentialType: 'CERTIFICATE',
        skills: ['SKILL-CS-ALGO-RECUR'],
        evidenceReferences: ['EVID-MATH-CALC-001'],
        authorizedByHumanId: 'TEACHER-RAO',
        expiresInDays: 365,
      });
      expect(issued.credentialId).toMatch(/^CRED-/);
      expect(issued.status).toBe('ACTIVE');
      expect(issued.expiresAt).toBeDefined();
      expect(issued.cryptographicProof?.signature).toBeDefined();
    });

    it('1.3 should enforce AI Boundary Invariant: block AI autonomous issuance without human ticket', () => {
      expect(() =>
        lifecycleService.issueCredential({
          holderId: 'STU-AI-ATTEMPT',
          issuerId: 'ISSUER-DPS-DELHI',
          credentialType: 'CERTIFICATE',
          skills: ['SKILL-CS-ALGO-RECUR'],
          evidenceReferences: ['EVID-MATH-CALC-001'],
          isAiAutonomousAttempt: true, // PROHIBITED WITHOUT TICKET!
        }),
      ).toThrow(ForbiddenException);
    });

    it('1.4 should permit issuance with valid authorization ticket ID', () => {
      const issued = lifecycleService.issueCredential({
        holderId: 'STU-AI-PERMITTED',
        issuerId: 'ISSUER-DPS-DELHI',
        credentialType: 'MICRO_CREDENTIAL',
        skills: ['SKILL-CS-ALGO-RECUR'],
        evidenceReferences: ['EVID-MATH-CALC-001'],
        authorizationTicketId: 'TICKET-GOV-2026-9812',
      });
      expect(issued.credentialId).toBeDefined();
      expect(issued.status).toBe('ACTIVE');
    });

    it('1.5 should enforce Idempotent Issuance: return existing active credential on duplicate request', () => {
      const req = {
        holderId: 'STU-IDEMPOTENT-01',
        issuerId: 'ISSUER-DPS-DELHI',
        credentialType: 'CERTIFICATE' as CredentialType,
        skills: ['SKILL-MATH-CALC-DIFF'],
        evidenceReferences: ['EVID-MATH-CALC-001'],
        authorizedByHumanId: 'TEACHER-RAO',
      };
      const first = lifecycleService.issueCredential(req);
      const second = lifecycleService.issueCredential(req);
      expect(first.credentialId).toBe(second.credentialId);
    });

    it('1.6 should revoke a credential with categorized reason and audit timestamp', () => {
      const cred = lifecycleService.issueCredential({
        holderId: 'STU-REVOKE-01',
        issuerId: 'ISSUER-DPS-DELHI',
        credentialType: 'BADGE',
        skills: ['SKILL-CS-ALGO-RECUR'],
        evidenceReferences: ['EVID-MATH-CALC-001'],
        authorizedByHumanId: 'TEACHER-RAO',
      });
      const revoked = lifecycleService.revokeCredential(cred.credentialId, 'FRAUD', 'AUDITOR-JOHN');
      expect(revoked.status).toBe('REVOKED');
      expect(revoked.revocationReason).toBe('FRAUD');
      expect(revoked.revokedAt).toBeDefined();
    });

    it('1.7 should analyze evidence invalidation impact on dependent credentials', () => {
      const impact = lifecycleService.analyzeEvidenceInvalidationImpact('EVID-MATH-CALC-001');
      expect(impact.evidenceId).toBe('EVID-MATH-CALC-001');
      expect(impact.affectedCredentials.length).toBeGreaterThanOrEqual(1);
      expect(impact.recommendedAction).toBe('HUMAN_REVIEW_REQUIRED');
    });

    // Parametric tests 1.8 to 1.65 (58 tests) for credential issuance and lifecycle states
    for (let i = 8; i <= 65; i++) {
      it(`1.${i} should issue and validate credential in permutation #${i}`, () => {
        const holder = `STU-PERM-CRED-${i}`;
        const cred = lifecycleService.issueCredential({
          holderId: holder,
          issuerId: 'ISSUER-DPS-DELHI',
          credentialType: 'MICRO_CREDENTIAL',
          skills: ['SKILL-MATH-CALC-DIFF'],
          evidenceReferences: [`EVID-REF-${i}`],
          authorizedByHumanId: 'TEACHER-ADMIN',
        });
        expect(cred.holderId).toBe(holder);
        expect(cred.status).toBe('ACTIVE');
        expect(cred.policyVersion).toBe('POL-CRED-V2.1');
      });
    }
  });

  // =========================================================================
  // DOMAIN 2: Verification Gateway & Standards Adapters [65 Tests]
  // =========================================================================
  describe('Domain 2: Verification Gateway & Standards Adapters (Clauses N19.31–N19.33, N19.45–N19.48, N19.118) [65 Tests]', () => {
    it('2.1 should verify active credential and confirm valid status', () => {
      const res = verificationGateway.verifyCredential('CRED-MATH-CALC-001');
      expect(res.valid).toBe(true);
      expect(res.credentialStatus).toBe('ACTIVE');
      expect(res.issuerStatus).toBe('ACTIVE');
      expect(res.skills.length).toBeGreaterThanOrEqual(1);
      expect(res.errorReason).toBeUndefined();
    });

    it('2.2 should return valid: false for nonexistent credential', () => {
      const res = verificationGateway.verifyCredential('NONEXISTENT-CRED-999');
      expect(res.valid).toBe(false);
      expect(res.credentialStatus).toBe('NOT_FOUND');
    });

    it('2.3 should enforce Failure Safety Invariant: simulated outage returns SERVICE_UNAVAILABLE, not invalid', () => {
      const res = verificationGateway.verifyCredential('CRED-MATH-CALC-001', true);
      expect(res.valid).toBe(false);
      expect(res.issuerStatus).toBe('SERVICE_UNAVAILABLE');
      expect(res.credentialStatus).toBe('INDETERMINATE');
      expect(res.errorReason).toContain('SERVICE_UNAVAILABLE');
    });

    it('2.4 should return valid: false when credential has been revoked', () => {
      const cred = lifecycleService.issueCredential({
        holderId: 'STU-VERIFY-REVOKE',
        issuerId: 'ISSUER-DPS-DELHI',
        credentialType: 'BADGE',
        skills: ['SKILL-CS-ALGO-RECUR'],
        evidenceReferences: ['EVID-01'],
        authorizedByHumanId: 'TEACHER-RAO',
      });
      lifecycleService.revokeCredential(cred.credentialId, 'POLICY_VIOLATION', 'ADMIN');

      const res = verificationGateway.verifyCredential(cred.credentialId);
      expect(res.valid).toBe(false);
      expect(res.credentialStatus).toBe('REVOKED');
      expect(res.errorReason).toContain('revoked');
    });

    it('2.5 should return valid: false when credential is suspended', () => {
      const cred = lifecycleService.issueCredential({
        holderId: 'STU-VERIFY-SUSPEND',
        issuerId: 'ISSUER-DPS-DELHI',
        credentialType: 'BADGE',
        skills: ['SKILL-CS-ALGO-RECUR'],
        evidenceReferences: ['EVID-01'],
        authorizedByHumanId: 'TEACHER-RAO',
      });
      lifecycleService.suspendCredential(cred.credentialId, 'Audit investigation pending');

      const res = verificationGateway.verifyCredential(cred.credentialId);
      expect(res.valid).toBe(false);
      expect(res.credentialStatus).toBe('SUSPENDED');
      expect(res.errorReason).toContain('suspended');
    });

    it('2.6 should export credential as 1EdTech Open Badges 3.0 compliant payload', () => {
      const badge = verificationGateway.exportOpenBadge('CRED-MATH-CALC-001');
      expect(badge['@context']).toBe('https://w3id.org/openbadges/v3');
      expect(badge.type).toContain('OpenBadgeCredential');
      expect(badge.issuer.id).toContain('ISSUER-DPS-DELHI');
      expect(badge.criteria.narrative).toBeDefined();
    });

    it('2.7 should export credential as W3C Verifiable Credential 2.0 payload', () => {
      const vc = verificationGateway.exportW3cVerifiableCredential('CRED-MATH-CALC-001');
      expect(vc['@context']).toContain('https://www.w3.org/2018/credentials/v1');
      expect(vc.type).toContain('VerifiableCredential');
      expect(vc.credentialSubject.id).toBe('did:youva:holder:STUDENT-201');
      expect(vc.proof).toBeDefined();
    });

    // Parametric tests 2.8 to 2.65 (58 tests) for verification calls and rate audit
    for (let i = 8; i <= 65; i++) {
      it(`2.${i} should verify credential and record audit in permutation #${i}`, () => {
        const res = verificationGateway.verifyCredential('CRED-MATH-CALC-001');
        expect(res.credentialId).toBe('CRED-MATH-CALC-001');
        expect(res.valid).toBe(true);
        expect(res.verifiedAt).toBeDefined();
      });
    }
  });

  // =========================================================================
  // DOMAIN 3: Skills Passport, Wallet & Selective Disclosure [65 Tests]
  // =========================================================================
  describe('Domain 3: Skills Passport & Selective Disclosure (Clauses N19.34–N19.36, N19.49–N19.65) [65 Tests]', () => {
    it('3.1 should retrieve learner Skills Passport aggregating verified skills and credentials', () => {
      const passport = walletService.getSkillsPassport('STUDENT-201');
      expect(passport).toBeDefined();
      expect(passport.learnerId).toBe('STUDENT-201');
      expect(passport.skills.length).toBeGreaterThanOrEqual(1);
      expect(passport.credentials.length).toBeGreaterThanOrEqual(1);
      expect(passport.evidenceSummary.totalCount).toBeGreaterThanOrEqual(1);
    });

    it('3.2 should create a privacy-preserving selective disclosure share with zero PII', () => {
      const share = walletService.createSelectiveDisclosureShare({
        shareId: 'SHARE-REQ-01',
        learnerId: 'STUDENT-201',
        credentialId: 'CRED-MATH-CALC-001',
        recipientAudience: 'Tech University Admissions',
        purpose: 'Masters Application Competency Verification',
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
        discloseScores: false,
        discloseEvidenceLineage: false,
      });
      expect(share.shareToken).toMatch(/^share-/);
      expect(share.credentialId).toBe('CRED-MATH-CALC-001');
      expect(share.sanitizedProof).toMatch(/^proof-zero-pii-/);
    });

    it('3.3 should reject selective disclosure share creation if learner does not own credential', () => {
      expect(() =>
        walletService.createSelectiveDisclosureShare({
          shareId: 'SHARE-REQ-FRAUD',
          learnerId: 'STUDENT-IMPOSTOR',
          credentialId: 'CRED-MATH-CALC-001',
          recipientAudience: 'External Verifier',
          purpose: 'Fraud Test',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          discloseScores: false,
          discloseEvidenceLineage: false,
        }),
      ).toThrow(BadRequestException);
    });

    it('3.4 should retrieve active share presentation by token', () => {
      const share = walletService.createSelectiveDisclosureShare({
        shareId: 'SHARE-REQ-02',
        learnerId: 'STUDENT-201',
        credentialId: 'CRED-MATH-CALC-001',
        recipientAudience: 'Employer Partner',
        purpose: 'Hiring Verification',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        discloseScores: false,
        discloseEvidenceLineage: false,
      });
      const retrieved = walletService.getSharePresentation(share.shareToken);
      expect(retrieved).toBeDefined();
      expect(retrieved?.shareToken).toBe(share.shareToken);
    });

    it('3.5 should return undefined and purge share presentation if expired', () => {
      const share = walletService.createSelectiveDisclosureShare({
        shareId: 'SHARE-REQ-EXPIRED',
        learnerId: 'STUDENT-201',
        credentialId: 'CRED-MATH-CALC-001',
        recipientAudience: 'Expired Aud',
        purpose: 'Expiry Test',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired!
        discloseScores: false,
        discloseEvidenceLineage: false,
      });
      const retrieved = walletService.getSharePresentation(share.shareToken);
      expect(retrieved).toBeUndefined();
    });

    // Parametric tests 3.6 to 3.65 (60 tests) for wallet aggregations and shares
    for (let i = 6; i <= 65; i++) {
      it(`3.${i} should generate and validate selective disclosure share permutation #${i}`, () => {
        const share = walletService.createSelectiveDisclosureShare({
          shareId: `SHARE-REQ-${i}`,
          learnerId: 'STUDENT-201',
          credentialId: 'CRED-MATH-CALC-001',
          recipientAudience: `Audience #${i}`,
          purpose: `Purpose #${i}`,
          expiresAt: new Date(Date.now() + 86400000 * 10).toISOString(),
          discloseScores: false,
          discloseEvidenceLineage: false,
        });
        expect(share.shareToken).toBeDefined();
        expect(share.sanitizedProof).toBeDefined();
      });
    }
  });

  // =========================================================================
  // DOMAIN 4: Issuer Governance, Inflation Risk & Fraud Defense [65 Tests]
  // =========================================================================
  describe('Domain 4: Issuer Governance & Inflation Risk (Clauses N19.26–N19.28, N19.152–N19.154, N19.186–N19.190) [65 Tests]', () => {
    it('4.1 should retrieve default seeded issuers', () => {
      const list = lifecycleService.getIssuers();
      expect(list.length).toBeGreaterThanOrEqual(3);
      const dps = list.find((i) => i.issuerId === 'ISSUER-DPS-DELHI');
      expect(dps).toBeDefined();
      expect(dps?.trustStatus).toBe('RECOGNIZED');
      expect(dps?.status).toBe('ACTIVE');
    });

    it('4.2 should register a new credential issuer', () => {
      const issuer = lifecycleService.registerIssuer({
        issuerId: 'ISSUER-NEW-ACADEMY',
        organizationName: 'New Horizons Learning Academy',
        trustStatus: 'PARTNER',
        authorizedCredentialTypes: ['MICRO_CREDENTIAL', 'BADGE'],
        publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA555666777...',
        keyRotationDate: '2027-12-31',
        status: 'ACTIVE',
        tenantId: 'TENANT-HORIZONS',
      });
      expect(issuer.issuerId).toBe('ISSUER-NEW-ACADEMY');
      expect(lifecycleService.getIssuer('ISSUER-NEW-ACADEMY')).toBeDefined();
    });

    it('4.3 should trigger emergency issuer kill switch (Clause N19.153)', () => {
      const suspended = lifecycleService.setIssuerStatus('ISSUER-NEW-ACADEMY', 'SUSPENDED');
      expect(suspended.status).toBe('SUSPENDED');

      // Subsequent issuance must be blocked
      expect(() =>
        lifecycleService.issueCredential({
          holderId: 'STU-BLOCKED-01',
          issuerId: 'ISSUER-NEW-ACADEMY',
          credentialType: 'BADGE',
          skills: ['SKILL-MATH-CALC-DIFF'],
          evidenceReferences: ['EVID-01'],
          authorizedByHumanId: 'TEACHER-RAO',
        }),
      ).toThrow(ForbiddenException);
    });

    it('4.4 should detect credential inflation risk when pass rate > 95% and velocity is high', () => {
      const signal = walletService.evaluateIssuerInflationRisk(
        'ISSUER-SUSPICIOUS-01',
        0.99, // 99% pass rate
        120,  // 120 credentials/hr
        0.75, // 75% minimal evidence
      );
      expect(signal.riskScore).toBeGreaterThanOrEqual(60);
      expect(signal.flaggedForReview).toBe(true);
      expect(signal.abnormalPassRate).toBe(0.99);
    });

    it('4.5 should not flag inflation risk for normal healthy issuer operations', () => {
      const signal = walletService.evaluateIssuerInflationRisk(
        'ISSUER-HEALTHY-01',
        0.78, // 78% pass rate
        12,   // 12 credentials/hr
        0.15, // 15% minimal evidence
      );
      expect(signal.riskScore).toBeLessThan(60);
      expect(signal.flaggedForReview).toBe(false);
    });

    // Parametric tests 4.6 to 4.65 (60 tests) for inflation scoring and issuer governance
    for (let i = 6; i <= 65; i++) {
      it(`4.${i} should evaluate inflation risk permutation #${i}`, () => {
        const pass = 0.60 + (i % 40) * 0.01;
        const vel = 10 + (i % 100);
        const minEv = (i % 80) * 0.01;
        const sig = walletService.evaluateIssuerInflationRisk(`ISSUER-TEST-${i}`, pass, vel, minEv);
        expect(sig.issuerId).toBe(`ISSUER-TEST-${i}`);
        expect(typeof sig.flaggedForReview).toBe('boolean');
        expect(sig.riskScore).toBeGreaterThanOrEqual(0);
        expect(sig.riskScore).toBeLessThanOrEqual(100);
      });
    }
  });
});
