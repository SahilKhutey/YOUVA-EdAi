import { Injectable } from '@nestjs/common';
import { AIAssuranceRecord, GroundingStatus } from '../../domain/assurance.types';

@Injectable()
export class AIAssuranceEvaluator {
  evaluate(aiOutput: {
    generationId: string;
    provider: string;
    model: string;
    inputReferences: string[];
    outputHash?: string;
    unsupportedClaimsCount?: number;
    partiallyGroundedClaimsCount?: number;
    attemptingToPublishDirectly?: boolean;
    humanApproved?: boolean;
  }): AIAssuranceRecord {
    const violations: string[] = [];

    // 1. Grounding check
    let groundingStatus: GroundingStatus = 'GROUNDED';
    if ((aiOutput.unsupportedClaimsCount ?? 0) > 0) {
      groundingStatus = 'UNSUPPORTED';
      violations.push(`AI output contains ${aiOutput.unsupportedClaimsCount} unsupported/hallucinated claim(s).`);
    } else if ((aiOutput.partiallyGroundedClaimsCount ?? 0) > 0) {
      groundingStatus = 'PARTIAL';
      violations.push(`AI output contains ${aiOutput.partiallyGroundedClaimsCount} partially grounded claim(s).`);
    }

    // 2. Output Hash Check
    const outputHash = aiOutput.outputHash ?? 'hash_missing';
    if (!aiOutput.outputHash) {
      violations.push('AI output lacks deterministic content hash.');
    }

    // 3. Human Review Gate (AI-002)
    const humanReviewRequired = true;
    let policyStatus: 'PASS' | 'WARNING' | 'BLOCK' = 'PASS';

    if (aiOutput.attemptingToPublishDirectly && !aiOutput.humanApproved) {
      policyStatus = 'BLOCK';
      violations.push('AI-002: Direct publication of AI output without authorized human review is BLOCKED.');
    } else if (groundingStatus === 'UNSUPPORTED') {
      policyStatus = 'BLOCK';
    } else if (groundingStatus === 'PARTIAL' || !aiOutput.outputHash) {
      policyStatus = 'WARNING';
    }

    return {
      generationId: aiOutput.generationId,
      provider: aiOutput.provider,
      model: aiOutput.model,
      inputReferences: aiOutput.inputReferences,
      outputHash,
      groundingStatus,
      policyStatus,
      humanReviewRequired,
      methodologyVersion: '1.0.0',
      violations,
    };
  }
}
