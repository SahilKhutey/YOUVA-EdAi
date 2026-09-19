import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  JurisdictionProfile,
  JurisdictionActivationRecord,
  JurisdictionActivationStep,
  JurisdictionStatus,
} from './n16-types';

@Injectable()
export class JurisdictionEngineService {
  private readonly logger = new Logger(JurisdictionEngineService.name);

  private readonly jurisdictions = new Map<string, JurisdictionProfile>();
  private readonly activationWorkflows = new Map<string, JurisdictionActivationRecord>();

  constructor() {
    this.seedDefaultJurisdictions();
  }

  private seedDefaultJurisdictions(): void {
    // 1. India - Delhi (IN-DL)
    const inDl: JurisdictionProfile = {
      jurisdictionId: 'IN-DL',
      name: 'India - National Capital Territory of Delhi',
      privacyPolicyVersion: 'dpdp-act-2023-v1.4',
      childSafetyPolicyVersion: 'poso-pocso-edu-v2.0',
      dataResidencyRules: ['DATA_LOCALIZATION_MANDATORY_IN_MUMBAI_DELHI', 'NO_CROSS_BORDER_PII_EXPORT'],
      retentionRules: ['STUDENT_RECORDS_7_YEARS', 'AUDIT_LOGS_10_YEARS'],
      educationRequirements: ['NCERT_ALIGNED', 'CBSE_COMPLIANT'],
      credentialRules: ['APAR_COMPATIBLE', 'DIGILOCKER_INTEGRATED', 'W3C_OPEN_BADGES'],
      approvedAiProviders: ['GEMINI_INDIA_CENTRAL', 'OLLAMA_LOCAL_SOVEREIGN'],
      sovereignDataCenterRegion: 'ap-south-1',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 2. European Union - Germany (EU-DE)
    const euDe: JurisdictionProfile = {
      jurisdictionId: 'EU-DE',
      name: 'European Union - Germany (Bavaria/Baden-Württemberg)',
      privacyPolicyVersion: 'gdpr-bdsg-v3.1',
      childSafetyPolicyVersion: 'eu-child-online-safety-v2',
      dataResidencyRules: ['EU_DATA_BOUNDARY_FRANKFURT', 'ZERO_US_CLOUD_EXFILTRATION'],
      retentionRules: ['GDPR_RIGHT_TO_ERASURE_30_DAYS', 'MAX_MINORS_LOG_12_MONTHS'],
      educationRequirements: ['KMK_LEHRLAP_ALIGNED'],
      credentialRules: ['EUROPASS_COMPATIBLE', 'EBSI_VERIFIABLE_CREDENTIALS'],
      approvedAiProviders: ['GEMINI_EU_FRANKFURT', 'OLLAMA_LOCAL_SOVEREIGN'],
      sovereignDataCenterRegion: 'eu-central-1',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. United States - California (US-CA)
    const usCa: JurisdictionProfile = {
      jurisdictionId: 'US-CA',
      name: 'United States - California',
      privacyPolicyVersion: 'coppa-ferpa-soppi-ccpa-v4',
      childSafetyPolicyVersion: 'california-age-appropriate-design-code',
      dataResidencyRules: ['US_WEST_OREGON', 'SOC2_TYPE2_DATASTORE'],
      retentionRules: ['FERPA_ACADEMIC_PERMANENT', 'COPPA_ANNUAL_PURGE'],
      educationRequirements: ['COMMON_CORE_CA', 'NGSS_ALIGNED'],
      credentialRules: ['W3C_VERIFIABLE_CREDENTIALS', '1EDTECH_OPEN_BADGES_V3'],
      approvedAiProviders: ['GEMINI_US_CENTRAL', 'ANTHROPIC_BEDROCK_US'],
      sovereignDataCenterRegion: 'us-west-2',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 4. United Kingdom - England (UK-ENG)
    const ukEng: JurisdictionProfile = {
      jurisdictionId: 'UK-ENG',
      name: 'United Kingdom - England & Wales',
      privacyPolicyVersion: 'uk-gdpr-dpa-2018-v2',
      childSafetyPolicyVersion: 'uk-age-appropriate-design-code-ico',
      dataResidencyRules: ['UK_SOUTH_LONDON', 'OFFSHORE_PROHIBITED'],
      retentionRules: ['UK_EDUCATION_RETENTION_SCHEDULE'],
      educationRequirements: ['NATIONAL_CURRICULUM_ENGLAND_KEYSTAGE_3_4'],
      credentialRules: ['OFQUAL_ALIGNED', 'W3C_VERIFIABLE_CREDENTIALS'],
      approvedAiProviders: ['GEMINI_UK_LONDON', 'OLLAMA_LOCAL_SOVEREIGN'],
      sovereignDataCenterRegion: 'eu-west-2',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.jurisdictions.set(inDl.jurisdictionId, inDl);
    this.jurisdictions.set(euDe.jurisdictionId, euDe);
    this.jurisdictions.set(usCa.jurisdictionId, usCa);
    this.jurisdictions.set(ukEng.jurisdictionId, ukEng);
  }

  // --- 1. Jurisdiction Registry Management (Clauses N16.12 - N16.13) ---

  public registerJurisdiction(profile: Omit<JurisdictionProfile, 'createdAt' | 'updatedAt' | 'status'>): JurisdictionProfile {
    if (this.jurisdictions.has(profile.jurisdictionId)) {
      throw new BadRequestException(`JUR-001: Jurisdiction [${profile.jurisdictionId}] already exists`);
    }

    const newProfile: JurisdictionProfile = {
      ...profile,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.jurisdictions.set(newProfile.jurisdictionId, newProfile);
    this.initializeActivationRecord(newProfile.jurisdictionId);
    this.logger.log(`Registered new jurisdiction [${newProfile.jurisdictionId}]: ${newProfile.name}`);
    return newProfile;
  }

  public getJurisdiction(jurisdictionId: string): JurisdictionProfile {
    const profile = this.jurisdictions.get(jurisdictionId);
    if (!profile) {
      throw new NotFoundException(`JUR-002: Jurisdiction [${jurisdictionId}] not found in registry`);
    }
    return profile;
  }

  public listJurisdictions(): JurisdictionProfile[] {
    return Array.from(this.jurisdictions.values());
  }

  // --- 2. The 10-Step Jurisdiction Activation Gate (Clauses N16.14, N16.159) ---

  private initializeActivationRecord(jurisdictionId: string): JurisdictionActivationRecord {
    const stepNames = [
      'Legal & Education Regulatory Analysis',
      'Privacy & Data Protection Compliance Audit',
      'Child Safeguarding & Protection Review',
      'Technical Data Residency & Sovereignty Audit',
      'Localization & Cultural Adaptations Review',
      'Curriculum Mapping & Standards Alignment',
      'Sovereign AI Provider Verification',
      'Independent Security & Penetration Audit',
      'Controlled Institutional Pilot Deployment',
      'Continuous Governance & Anomaly Monitoring',
    ];

    const steps: JurisdictionActivationStep[] = stepNames.map((name, index) => ({
      stepNumber: index + 1,
      stepName: name,
      status: index === 0 ? 'IN_PROGRESS' : 'PENDING',
    }));

    const record: JurisdictionActivationRecord = {
      jurisdictionId,
      currentStep: 1,
      steps,
      overallStatus: 'PENDING',
      updatedAt: new Date().toISOString(),
    };

    this.activationWorkflows.set(jurisdictionId, record);
    return record;
  }

  public getActivationStatus(jurisdictionId: string): JurisdictionActivationRecord {
    let rec = this.activationWorkflows.get(jurisdictionId);
    if (!rec) {
      // Auto-initialize if existing jurisdiction
      rec = this.initializeActivationRecord(jurisdictionId);
      // If already active, mark all steps passed
      const j = this.jurisdictions.get(jurisdictionId);
      if (j && j.status === 'ACTIVE') {
        rec.steps.forEach((s) => (s.status = 'PASSED'));
        rec.currentStep = 10;
        rec.overallStatus = 'ACTIVATED';
      }
    }
    return rec;
  }

  public advanceActivationStep(params: {
    jurisdictionId: string;
    stepNumber: number;
    reviewerId: string;
    evidenceUrl: string;
    passed: boolean;
    notes?: string;
  }): JurisdictionActivationRecord {
    const record = this.getActivationStatus(params.jurisdictionId);

    if (params.stepNumber !== record.currentStep) {
      throw new BadRequestException(
        `JUR-003: Step out of sequence. Current step is #${record.currentStep}, requested step is #${params.stepNumber}`
      );
    }

    const step = record.steps[params.stepNumber - 1];
    step.reviewerId = params.reviewerId;
    step.evidenceUrl = params.evidenceUrl;
    step.notes = params.notes;
    step.completedAt = new Date().toISOString();

    if (!params.passed) {
      step.status = 'FAILED';
      record.overallStatus = 'BLOCKED';
      record.updatedAt = new Date().toISOString();
      this.logger.warn(`Activation step #${params.stepNumber} failed for jurisdiction [${params.jurisdictionId}]`);
      return record;
    }

    step.status = 'PASSED';

    if (params.stepNumber < 10) {
      record.currentStep = params.stepNumber + 1;
      record.steps[record.currentStep - 1].status = 'IN_PROGRESS';
      if (record.currentStep === 9) {
        record.overallStatus = 'READY_FOR_PILOT';
      }
    } else {
      // Step 10 passed: fully activated
      record.overallStatus = 'ACTIVATED';
      const jurisdiction = this.getJurisdiction(params.jurisdictionId);
      jurisdiction.status = 'ACTIVE';
      jurisdiction.updatedAt = new Date().toISOString();
      this.logger.log(`Jurisdiction [${params.jurisdictionId}] successfully ACTIVATED after passing all 10 gates.`);
    }

    record.updatedAt = new Date().toISOString();
    return record;
  }

  // --- 3. Data Residency Validation (Clause N16.15) ---

  public validateDataResidency(jurisdictionId: string, requestedStorageRegion: string): boolean {
    const j = this.getJurisdiction(jurisdictionId);

    if (j.status === 'SUSPENDED') {
      throw new ForbiddenException(`JUR-005: Jurisdiction [${jurisdictionId}] is SUSPENDED. Data routing disallowed.`);
    }

    // Must match sovereign data center region
    if (j.sovereignDataCenterRegion !== requestedStorageRegion) {
      throw new ForbiddenException(
        `JUR-006: Data residency violation. Jurisdiction [${jurisdictionId}] requires sovereign region [${j.sovereignDataCenterRegion}], received [${requestedStorageRegion}]`
      );
    }

    return true;
  }

  // --- 4. Jurisdiction-Aware AI Data Router (Clause N16.16 - N16.17) ---

  public routeAiRequest(params: {
    jurisdictionId: string;
    learnerId: string;
    dataClassification: 'PUBLIC' | 'RESTRICTED_STUDENT_PII' | 'CHILD_VOICE_STREAM' | 'CONSEQUENTIAL_ASSESSMENT';
    requestedProvider: string;
  }): {
    routedProvider: string;
    isSovereignEnclave: boolean;
    auditVerificationHash: string;
  } {
    const j = this.getJurisdiction(params.jurisdictionId);

    if (j.status === 'SUSPENDED') {
      throw new ForbiddenException(
        `JUR-007: Market expansion suspended for jurisdiction [${params.jurisdictionId}]. Autonomous AI calls denied.`
      );
    }

    // Verify provider is approved for this jurisdiction
    const isApproved = j.approvedAiProviders.includes(params.requestedProvider);

    if (!isApproved) {
      this.logger.warn(
        `Provider [${params.requestedProvider}] not approved for [${params.jurisdictionId}]. Falling back to local sovereign model.`
      );
      return {
        routedProvider: 'OLLAMA_LOCAL_SOVEREIGN',
        isSovereignEnclave: true,
        auditVerificationHash: `sovereign-${params.jurisdictionId}-${Date.now()}`,
      };
    }

    return {
      routedProvider: params.requestedProvider,
      isSovereignEnclave: params.requestedProvider.includes('LOCAL') || params.requestedProvider.includes(j.sovereignDataCenterRegion),
      auditVerificationHash: `routed-${j.jurisdictionId}-${params.requestedProvider}`,
    };
  }

  // --- 5. Market Exit & Emergency Suspension Strategy (Clauses N16.115, N16.164) ---

  public suspendJurisdiction(jurisdictionId: string, reason: string): JurisdictionProfile {
    const j = this.getJurisdiction(jurisdictionId);
    j.status = 'SUSPENDED';
    j.updatedAt = new Date().toISOString();
    this.logger.error(`EMERGENCY SUSPENSION: Jurisdiction [${jurisdictionId}] suspended. Reason: ${reason}`);
    return j;
  }

  public reinstateJurisdiction(jurisdictionId: string, reviewerId: string): JurisdictionProfile {
    const j = this.getJurisdiction(jurisdictionId);
    j.status = 'ACTIVE';
    j.updatedAt = new Date().toISOString();
    this.logger.log(`Jurisdiction [${jurisdictionId}] reinstated to ACTIVE by [${reviewerId}]`);
    return j;
  }
}
