import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CollectiveLearningGroup,
  KnowledgeContribution,
  ContributionType,
} from './n23-types';
import * as crypto from 'crypto';

@Injectable()
export class CollectiveLearningContributionService {
  private readonly groups = new Map<string, CollectiveLearningGroup>();
  private readonly contributions = new Map<string, KnowledgeContribution>();

  constructor() {
    this.seedInitialData();
  }

  /**
   * Invariant N23.21–N23.26: Collective Learning & Peer Matching without Social Ranking.
   * Matches learners on capability complementarity, never on popularity or "high-potential" scores.
   */
  createLearningGroup(data: Partial<CollectiveLearningGroup>): CollectiveLearningGroup {
    if (!data.title || !data.domain) {
      throw new BadRequestException('title and domain are required');
    }

    const groupId = data.groupId || `grp_${crypto.randomBytes(8).toString('hex')}`;
    const group: CollectiveLearningGroup = {
      groupId,
      title: data.title,
      domain: data.domain,
      members: data.members || [],
      complementaryCapabilities: data.complementaryCapabilities || [],
      activeProject: data.activeProject,
      createdAt: new Date().toISOString(),
    };

    this.groups.set(groupId, group);
    return group;
  }

  joinLearningGroup(
    groupId: string,
    learnerId: string,
    role: 'FACILITATOR' | 'PARTICIPANT' | 'PEER_REVIEWER' = 'PARTICIPANT',
  ): CollectiveLearningGroup {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new NotFoundException(`Group ${groupId} not found`);
    }

    const existingMember = group.members.find((m) => m.learnerId === learnerId);
    if (!existingMember) {
      group.members.push({
        learnerId,
        role,
        joinedAt: new Date().toISOString(),
      });
    }

    return group;
  }

  listGroups(domain?: string): CollectiveLearningGroup[] {
    let list = Array.from(this.groups.values());
    if (domain) {
      list = list.filter((g) => g.domain.toLowerCase() === domain.toLowerCase());
    }
    return list;
  }

  /**
   * Invariant N23.27–N23.30 & N23.93–N23.95 & N23.106:
   * Attributable Contributions, Team Role Preservation, and Mandatory AI Disclosure.
   */
  submitKnowledgeContribution(data: Partial<KnowledgeContribution>): KnowledgeContribution {
    if (!data.authorId || !data.title || !data.type || !data.artifactUri) {
      throw new BadRequestException('authorId, title, type, and artifactUri are required');
    }

    if (data.aiAssistanceDisclosed && !data.aiAssistanceDetails) {
      throw new BadRequestException(
        'AI assistance was declared but details of AI contributions were omitted',
      );
    }

    const contributionId = data.contributionId || `contrib_${crypto.randomBytes(8).toString('hex')}`;
    const record: KnowledgeContribution = {
      contributionId,
      authorId: data.authorId,
      title: data.title,
      type: data.type,
      artifactUri: data.artifactUri,
      aiAssistanceDisclosed: !!data.aiAssistanceDisclosed,
      aiAssistanceDetails: data.aiAssistanceDetails,
      validationStatus: data.validationStatus || 'SUBMITTED',
      teamAttribution: data.teamAttribution || [],
      createdAt: new Date().toISOString(),
    };

    this.contributions.set(contributionId, record);
    return record;
  }

  validateContribution(
    contributionId: string,
    status: KnowledgeContribution['validationStatus'],
  ): KnowledgeContribution {
    const record = this.contributions.get(contributionId);
    if (!record) {
      throw new NotFoundException(`Contribution ${contributionId} not found`);
    }

    record.validationStatus = status;
    return record;
  }

  listContributions(authorId?: string, type?: ContributionType): KnowledgeContribution[] {
    let list = Array.from(this.contributions.values());
    if (authorId) {
      list = list.filter((c) => c.authorId === authorId);
    }
    if (type) {
      list = list.filter((c) => c.type === type);
    }
    return list;
  }

  private seedInitialData(): void {
    this.createLearningGroup({
      groupId: 'grp_nlp_interpretability_01',
      title: 'Mechanistic Interpretability Study Circle',
      domain: 'Artificial Intelligence',
      complementaryCapabilities: ['Python', 'Linear Algebra', 'Transformer Mechanics'],
      members: [
        { learnerId: 'learner_asha_402', role: 'FACILITATOR', joinedAt: '2026-09-10' },
        { learnerId: 'learner_rohit_811', role: 'PARTICIPANT', joinedAt: '2026-09-12' },
      ],
      activeProject: 'Attention Head Attribution in Open Science',
    });

    this.submitKnowledgeContribution({
      contributionId: 'contrib_tutorial_numpy_01',
      authorId: 'learner_asha_402',
      title: 'Visualizing Matrix Transformations for Beginners',
      type: 'OER_TUTORIAL',
      artifactUri: 'https://youva-knowledge.org/tutorials/matrix-viz',
      aiAssistanceDisclosed: true,
      aiAssistanceDetails: 'Interactive SVG scaffold assisted by AI, conceptual explanation authored manually',
      validationStatus: 'VALIDATED',
      teamAttribution: [
        {
          contributorId: 'learner_asha_402',
          role: 'Primary Author & Animator',
          contributionSummary: 'Created pedagogical narrative and dynamic matrix transformations',
        },
      ],
    });
  }
}
