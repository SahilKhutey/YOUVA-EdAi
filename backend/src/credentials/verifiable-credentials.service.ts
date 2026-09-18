import { Injectable, Logger } from '@nestjs/common';
import {
  W3CVerifiableCredential,
  CredentialRecord,
  CredentialPolicy,
  LearningEvidence,
} from './credential-types';
import { CryptoKeyService } from './crypto-key.service';
import { SkillTaxonomyService } from './skill-taxonomy.service';

@Injectable()
export class VerifiableCredentialsService {
  private readonly logger = new Logger(VerifiableCredentialsService.name);

  constructor(
    private readonly cryptoKeyService: CryptoKeyService,
    private readonly taxonomyService: SkillTaxonomyService,
  ) {}

  /**
   * Normalizes VC claims into a canonical string for cryptographic signing.
   */
  canonicalizeClaims(vcWithoutProof: Omit<W3CVerifiableCredential, 'proof'>): string {
    return JSON.stringify({
      context: vcWithoutProof['@context'],
      id: vcWithoutProof.id,
      type: vcWithoutProof.type,
      issuer: vcWithoutProof.issuer,
      issuanceDate: vcWithoutProof.issuanceDate,
      expirationDate: vcWithoutProof.expirationDate,
      credentialSubject: vcWithoutProof.credentialSubject,
      evidence: vcWithoutProof.evidence,
    });
  }

  /**
   * Constructs and cryptographically signs a W3C Verifiable Credential (Clauses N12.19 - N12.20).
   */
  issueVerifiableCredential(
    credential: CredentialRecord,
    policy: CredentialPolicy,
    evidences: LearningEvidence[]
  ): W3CVerifiableCredential {
    const skills = policy.requiredSkills.map(sId => {
      try {
        const s = this.taxonomyService.getSkill(sId);
        return {
          id: s.skillId,
          name: s.name,
          domain: s.domain,
          level: s.level,
        };
      } catch {
        return {
          id: sId,
          name: sId,
          domain: policy.domain,
          level: 'INTERMEDIATE',
        };
      }
    });

    const unsignedVc: Omit<W3CVerifiableCredential, 'proof'> = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
      ],
      id: `urn:uuid:${credential.credentialId}`,
      type: ['VerifiableCredential', 'SkillsCredential', 'HighSchoolAchievementCredential'],
      issuer: {
        id: 'did:youva:issuer:delhi-01',
        name: 'YOUVA-EdAI Accredited Secondary Education Node',
      },
      issuanceDate: credential.issuedAt || new Date().toISOString(),
      expirationDate: credential.expiresAt,
      credentialSubject: {
        id: `did:youva:learner:${credential.learnerId}`,
        skills,
        achievement: {
          id: policy.credentialId,
          title: policy.title,
          description: policy.description,
        },
      },
      evidence: evidences.map(e => ({
        id: `urn:uuid:${e.evidenceId}`,
        type: ['LearningEvidence', e.evidenceType],
        evidenceType: e.evidenceType,
        qualityLevel: e.qualityLevel,
      })),
    };

    const canonicalClaims = this.canonicalizeClaims(unsignedVc);
    const proof = this.cryptoKeyService.signPayload(canonicalClaims);

    const verifiableCredential: W3CVerifiableCredential = {
      ...unsignedVc,
      proof,
    };

    this.logger.log(`Constructed and signed W3C VC: ${verifiableCredential.id} with key ${proof.keyId}`);
    return verifiableCredential;
  }

  /**
   * Verifies the cryptographic proof and structural integrity of a W3C VC.
   */
  verifyVerifiableCredential(vc: W3CVerifiableCredential): { valid: boolean; reason?: string } {
    if (!vc.proof || !vc.proof.proofValue || !vc.proof.keyId) {
      return { valid: false, reason: 'Missing cryptographic proof block.' };
    }

    const { proof, ...unsignedVc } = vc;
    const canonicalClaims = this.canonicalizeClaims(unsignedVc);

    return this.cryptoKeyService.verifySignature(canonicalClaims, proof);
  }
}
