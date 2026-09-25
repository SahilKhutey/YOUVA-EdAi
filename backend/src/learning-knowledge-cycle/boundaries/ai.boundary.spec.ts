import { AiSafetyGuard } from './ai.boundary';
import { KnowledgeVersion } from '../contracts/knowledge-object.contract';

describe('AiSafetyGuard', () => {
  it('should throw when attempting to publish an AI-generated version that is not APPROVED', () => {
    const unapprovedAiVersion: KnowledgeVersion = {
      id: 'ver-123',
      knowledgeObjectId: 'obj-456',
      version: 1,
      content: { text: 'AI generated explanation' },
      contentHash: 'hash-abc',
      authorId: 'ai-agent-1',
      sourceType: 'AI',
      reviewStatus: 'PENDING_REVIEW',
      createdAt: new Date(),
    };

    expect(() => AiSafetyGuard.verifyCanPublish(unapprovedAiVersion)).toThrow(
      /AI Safety Violation: AI-generated version 1 of knowledge object obj-456 cannot be published without explicit human review approval/,
    );
  });

  it('should allow publishing an AI-generated version once APPROVED by human review', () => {
    const approvedAiVersion: KnowledgeVersion = {
      id: 'ver-124',
      knowledgeObjectId: 'obj-456',
      version: 1,
      content: { text: 'AI generated explanation' },
      contentHash: 'hash-abc',
      authorId: 'ai-agent-1',
      sourceType: 'AI',
      reviewStatus: 'APPROVED',
      createdAt: new Date(),
    };

    expect(() => AiSafetyGuard.verifyCanPublish(approvedAiVersion)).not.toThrow();
  });

  it('should allow publishing teacher authored versions', () => {
    const teacherVersion: KnowledgeVersion = {
      id: 'ver-125',
      knowledgeObjectId: 'obj-789',
      version: 1,
      content: { text: 'Teacher explanation' },
      contentHash: 'hash-xyz',
      authorId: 'teacher-1',
      sourceType: 'TEACHER',
      reviewStatus: 'APPROVED',
      createdAt: new Date(),
    };

    expect(() => AiSafetyGuard.verifyCanPublish(teacherVersion)).not.toThrow();
  });
});
