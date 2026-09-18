import { Injectable, Logger, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  HighSchoolProjectSubmission,
  AIAssistanceDisclosure,
  PortfolioArtifact,
} from './credential-types';

@Injectable()
export class ProjectAssessmentService {
  private readonly logger = new Logger(ProjectAssessmentService.name);
  private readonly projectStore = new Map<string, HighSchoolProjectSubmission>();
  private readonly portfolioStore = new Map<string, PortfolioArtifact>();

  /**
   * Submits a high-school capstone or PBL project with full AI assistance disclosure.
   */
  submitProject(params: {
    learnerId: string;
    tenantId: string;
    title: string;
    domain: string;
    problemStatement: string;
    artifactUrl: string;
    repositoryUrl?: string;
    aiDisclosure: AIAssistanceDisclosure;
  }): HighSchoolProjectSubmission {
    if (!params.learnerId || !params.title || !params.artifactUrl) {
      throw new BadRequestException('learnerId, title, and artifactUrl are required.');
    }
    if (!params.aiDisclosure || !params.aiDisclosure.humanContributions) {
      throw new BadRequestException('Mandatory AI disclosure with declared human contributions is required.');
    }

    // Authenticity score calculation (Clause N12.44 - N12.45)
    const authenticityScore = this.calculateAuthenticityScore(params.aiDisclosure);

    const projectId = `proj-${crypto.randomUUID()}`;
    const submission: HighSchoolProjectSubmission = {
      projectId,
      learnerId: params.learnerId,
      tenantId: params.tenantId,
      title: params.title,
      domain: params.domain,
      problemStatement: params.problemStatement,
      artifactUrl: params.artifactUrl,
      repositoryUrl: params.repositoryUrl,
      aiDisclosure: params.aiDisclosure,
      authenticityScore,
      submittedAt: new Date().toISOString(),
      status: 'SUBMITTED',
    };

    this.projectStore.set(projectId, submission);
    this.logger.log(`Project submitted: ${projectId} by ${params.learnerId} (Authenticity: ${authenticityScore})`);
    return submission;
  }

  getProject(projectId: string): HighSchoolProjectSubmission {
    const proj = this.projectStore.get(projectId);
    if (!proj) {
      throw new NotFoundException(`Project '${projectId}' not found.`);
    }
    return proj;
  }

  listLearnerProjects(learnerId: string, tenantId?: string): HighSchoolProjectSubmission[] {
    let list = Array.from(this.projectStore.values()).filter(p => p.learnerId === learnerId);
    if (tenantId) {
      list = list.filter(p => p.tenantId === tenantId);
    }
    return list;
  }

  /**
   * Computes authenticity score based on human contributions and balanced AI usage.
   * High authenticity requires human problem definition, testing, and reflection.
   */
  calculateAuthenticityScore(disclosure: AIAssistanceDisclosure): number {
    let score = 1.0;
    const { humanContributions, codeGenerationPct, editingPct, brainstormingPct } = disclosure;

    // Penalize if human did not define the problem
    if (!humanContributions.problemDefinition) {
      score -= 0.30;
    }
    // Penalize if human did not make architectural decisions
    if (!humanContributions.architecturalDecisions) {
      score -= 0.20;
    }
    // Penalize if human did not perform verification or testing
    if (!humanContributions.testingAndVerification) {
      score -= 0.25;
    }
    // Penalize if human provided no reflection
    if (!humanContributions.personalReflection) {
      score -= 0.15;
    }

    // Heavy penalty for 100% unassisted machine code without human oversight
    if (codeGenerationPct > 90 && !humanContributions.testingAndVerification) {
      score -= 0.25;
    }

    // Clamp between 0.05 and 1.0
    const finalScore = Math.max(0.05, Math.min(1.0, score));
    return Math.round(finalScore * 100) / 100;
  }

  /**
   * Portfolio Artifact Management (N12.31 - N12.32)
   * Default visibility is strictly PRIVATE.
   */
  createPortfolioArtifact(params: {
    learnerId: string;
    tenantId: string;
    title: string;
    description: string;
    skills: string[];
    evidenceIds: string[];
    visibility?: 'PRIVATE' | 'SHARED';
  }): PortfolioArtifact {
    const artifactId = `art-${crypto.randomUUID()}`;
    const artifact: PortfolioArtifact = {
      artifactId,
      learnerId: params.learnerId,
      tenantId: params.tenantId,
      title: params.title,
      description: params.description,
      skills: params.skills || [],
      evidenceIds: params.evidenceIds || [],
      visibility: params.visibility || 'PRIVATE', // Strictly private by default (N12.32)
      version: 'v1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.portfolioStore.set(artifactId, artifact);
    this.logger.log(`Created portfolio artifact ${artifactId} for ${params.learnerId} (Visibility: ${artifact.visibility})`);
    return artifact;
  }

  getPortfolioArtifact(artifactId: string, learnerId?: string): PortfolioArtifact {
    const art = this.portfolioStore.get(artifactId);
    if (!art) {
      throw new NotFoundException(`Portfolio artifact '${artifactId}' not found.`);
    }
    if (art.visibility === 'PRIVATE' && learnerId && art.learnerId !== learnerId) {
      throw new UnauthorizedException('Access denied to private portfolio artifact.');
    }
    return art;
  }

  generateShareLink(artifactId: string, learnerId: string, ttlHours: number = 72): { shareUrl: string; expiresAt: string; shareToken: string } {
    const art = this.getPortfolioArtifact(artifactId, learnerId);
    if (art.learnerId !== learnerId) {
      throw new UnauthorizedException('Only the owner can generate sharing links.');
    }

    const shareToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

    art.visibility = 'SHARED';
    art.shareToken = shareToken;
    art.shareExpiresAt = expiresAt;
    art.updatedAt = new Date().toISOString();

    return {
      shareUrl: `/portfolio/share/${shareToken}`,
      expiresAt,
      shareToken,
    };
  }

  revokeShareLink(artifactId: string, learnerId: string): boolean {
    const art = this.getPortfolioArtifact(artifactId, learnerId);
    if (art.learnerId !== learnerId) {
      throw new UnauthorizedException('Only the owner can revoke sharing links.');
    }
    art.visibility = 'PRIVATE';
    art.shareToken = undefined;
    art.shareExpiresAt = undefined;
    art.updatedAt = new Date().toISOString();
    return true;
  }
}
