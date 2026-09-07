import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { EvidenceController } from './evidence/evidence.controller';
import { EvidenceService } from './evidence/evidence.service';
import { EvidenceIntegrityService } from './evidence/evidence-integrity.service';

import { ClaimController } from './claims/claim.controller';
import { ClaimService } from './claims/claim.service';

import { CausalStudyController } from './causal/causal-study.controller';
import { CausalStudyService } from './causal/causal-study.service';

import { KnowledgeController } from './knowledge/knowledge.controller';
import { KnowledgeService } from './knowledge/knowledge.service';

import { AIDecisionTraceController } from './ai-trace/ai-trace.controller';
import { AIDecisionTraceService } from './ai-trace/ai-trace.service';

import { TrustService } from './trust/trust.service';

import { GovernanceController } from './governance/governance.controller';
import { GovernanceService } from './governance/governance.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    EvidenceController,
    ClaimController,
    CausalStudyController,
    KnowledgeController,
    AIDecisionTraceController,
    GovernanceController,
  ],
  providers: [
    EvidenceService,
    EvidenceIntegrityService,
    ClaimService,
    CausalStudyService,
    KnowledgeService,
    AIDecisionTraceService,
    TrustService,
    GovernanceService,
  ],
  exports: [
    EvidenceService,
    EvidenceIntegrityService,
    ClaimService,
    KnowledgeService,
    AIDecisionTraceService,
    TrustService,
  ],
})
export class VerifiedLearningModule {}
