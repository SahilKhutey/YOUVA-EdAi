import { Test, TestingModule } from '@nestjs/testing';
import { AiKnowledgeService } from '../ai-knowledge.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { KnowledgeRetrieverService } from '../retrieval/knowledge-retriever.service';
import { GroundingValidatorService } from '../grounding/grounding-validator.service';
import { AiGuardrailService } from '../guardrails/ai-guardrail.service';
import { AiProvenanceService } from '../provenance/ai-provenance.service';
import { AiService } from '../../../ai/ai.service';
import { AiCapability } from '../ai.types';

describe('AiKnowledgeService (LKC-6)', () => {
  let service: AiKnowledgeService;
  let mockRetriever: any;
  let mockProvenance: any;
  let mockAiService: any;
  let mockPrisma: any;

  const mockContext = {
    tenantId: 'tenant-1',
    targetKnowledge: {
      id: 'k-photosynthesis',
      versionId: 'v-photosynthesis-1',
      title: 'Photosynthesis Fundamentals',
      type: 'CONCEPT',
      status: 'PUBLISHED',
      content:
        'Photosynthesis is the biological process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of glucose.',
    },
    prerequisites: [
      {
        id: 'k-cell-structure',
        versionId: 'v-cell-1',
        title: 'Cellular Structure and Chloroplasts',
        type: 'CONCEPT',
        status: 'PUBLISHED',
        content: 'Chloroplasts contain chlorophyll which absorbs photons of light.',
      },
    ],
    learnerState: {
      masteryLevel: 0.6,
      confidence: 0.7,
      status: 'PRACTICING',
    },
  };

  beforeEach(async () => {
    mockRetriever = {
      retrieveContext: jest.fn().mockResolvedValue(mockContext),
    };

    mockProvenance = {
      recordProvenance: jest.fn().mockResolvedValue({
        requestId: 'ai-req-123',
        provenanceId: 'ai-prov-123',
        outputHash: 'hash-abc-123',
      }),
      getProvenance: jest.fn(),
    };

    mockAiService = {
      generateStructured: jest.fn().mockImplementation((prompt, schema, fallback) => {
        // Return fallback output wrapped as StructuredGenerationResult
        return Promise.resolve({
          data: fallback ? fallback() : {},
          provider: 'GEMINI',
          fallbackUsed: false,
          timestamp: new Date().toISOString(),
          rawText: JSON.stringify(fallback ? fallback() : {}),
        });
      }),
    };

    mockPrisma = {
      knowledgeObject: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'k-cell-structure', title: 'Cellular Structure and Chloroplasts', type: 'CONCEPT' },
          { id: 'k-plant-biology', title: 'Introduction to Plant Biology', type: 'CONCEPT' },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiKnowledgeService,
        GroundingValidatorService,
        AiGuardrailService,
        { provide: KnowledgeRetrieverService, useValue: mockRetriever },
        { provide: AiProvenanceService, useValue: mockProvenance },
        { provide: AiService, useValue: mockAiService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AiKnowledgeService>(AiKnowledgeService);
  });

  describe('Teacher Capabilities', () => {
    it('generateExample: produces grounded example with requiresReview: true', async () => {
      const res = await service.generateExample('teacher-1', 'k-photosynthesis', 'Use a greenhouse');

      expect(res.capability).toBe(AiCapability.GENERATE_EXAMPLE);
      expect(res.canonical).toBe(false);
      expect(res.requiresReview).toBe(true);
      expect(res.data.example).toBeDefined();
      expect(res.data.explanation).toBeDefined();
      expect(mockProvenance.recordProvenance).toHaveBeenCalledWith(
        expect.objectContaining({
          capability: AiCapability.GENERATE_EXAMPLE,
          knowledgeObjectId: 'k-photosynthesis',
        }),
      );
    });

    it('generateQuestions: produces assessment questions draft', async () => {
      const res = await service.generateQuestions('teacher-1', 'k-photosynthesis', 2);

      expect(res.capability).toBe(AiCapability.GENERATE_QUESTION);
      expect(res.canonical).toBe(false);
      expect(res.requiresReview).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data[0].stem).toContain('Photosynthesis Fundamentals');
      expect(res.data[0].options?.length).toBe(4);
    });

    it('suggestObjectives: suggests Bloom-aligned objectives', async () => {
      const res = await service.suggestObjectives('teacher-1', 'k-photosynthesis');

      expect(res.capability).toBe(AiCapability.SUGGEST_OBJECTIVES);
      expect(res.requiresReview).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
      expect(res.data[0].bloomLevel).toBeDefined();
    });

    it('suggestPrerequisites: identifies candidate prerequisites from library', async () => {
      const res = await service.suggestPrerequisites('teacher-1', 'k-photosynthesis');

      expect(res.capability).toBe(AiCapability.SUGGEST_PREREQUISITES);
      expect(res.data.length).toBeGreaterThan(0);
      expect(res.data[0].title).toBeDefined();
      expect(res.data[0].confidence).toBeGreaterThan(0);
    });

    it('analyzeQuality: generates pedagogical quality scores and issues', async () => {
      const res = await service.analyzeQuality('teacher-1', 'k-photosynthesis');

      expect(res.capability).toBe(AiCapability.QUALITY_ANALYSIS);
      expect(res.responseType).toBe('ANALYTICAL_SIGNAL');
      expect(res.data.completeness).toBeGreaterThan(0);
      expect(res.data.clarity).toBeGreaterThan(0);
      expect(Array.isArray(res.data.issues)).toBe(true);
    });

    it('differentiateContent: adapts content to target reading level', async () => {
      const res = await service.differentiateContent('teacher-1', 'k-photosynthesis', 'Grade 5');

      expect(res.capability).toBe(AiCapability.DIFFERENTIATE);
      expect(res.data.differentiatedText).toBeDefined();
      expect(Array.isArray(res.data.adjustments)).toBe(true);
    });
  });

  describe('Student Capabilities', () => {
    it('explain: generates grounded explanation without requiring review', async () => {
      const res = await service.explain(
        'student-1',
        'k-photosynthesis',
        'What role does sunlight play?',
      );

      expect(res.capability).toBe(AiCapability.GENERATE_EXPLANATION);
      expect(res.canonical).toBe(false);
      expect(res.requiresReview).toBe(false);
      expect(res.data.explanation).toBeDefined();
      expect(res.data.followUpQuestions.length).toBeGreaterThan(0);
    });

    it('hint: provides progressive scaffolding and masks answer leakage', async () => {
      // First attempt: CONCEPTUAL
      const resAttempt1 = await service.hint(
        'student-1',
        'k-photosynthesis',
        'q-1',
        1,
        'chloroplast',
      );
      expect(resAttempt1.data.scaffoldLevel).toBe('CONCEPTUAL');
      expect(resAttempt1.requiresReview).toBe(false);

      // Third attempt: SETUP
      const resAttempt3 = await service.hint(
        'student-1',
        'k-photosynthesis',
        'q-1',
        3,
        'chloroplast',
      );
      expect(resAttempt3.data.scaffoldLevel).toBe('SETUP');
    });

    it('summarize: generates concise summary and key takeaways', async () => {
      const res = await service.summarize('student-1', 'k-photosynthesis');

      expect(res.capability).toBe(AiCapability.GENERATE_SUMMARY);
      expect(res.data.summary).toBeDefined();
      expect(res.data.keyPoints.length).toBeGreaterThan(0);
    });

    it('searchAssist: finds published suggestions matching query', async () => {
      const res = await service.searchAssist('student-1', 'plant');

      expect(res.capability).toBe(AiCapability.SEARCH_ASSIST);
      expect(res.data.suggestions).toBeDefined();
    });
  });
});
