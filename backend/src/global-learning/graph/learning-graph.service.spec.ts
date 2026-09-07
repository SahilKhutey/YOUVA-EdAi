import { LearningGraphService } from './learning-graph.service';
import { NotFoundException } from '@nestjs/common';

describe('LearningGraphService', () => {
  let service: LearningGraphService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      learningConcept: {
        findUnique: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'c-new', ...data })),
      },
      learningConceptRelation: {
        findMany: jest.fn(),
        upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'rel-1', ...create })),
      },
    };

    service = new LearningGraphService(mockPrisma);
  });

  it('returns a concept and its relations', async () => {
    mockPrisma.learningConcept.findUnique.mockResolvedValue({
      id: 'c1',
      name: 'Fractions',
      canonicalKey: 'math_fractions',
    });

    mockPrisma.learningConceptRelation.findMany.mockResolvedValue([]);

    const result = await service.getConcept('c1');

    expect(result.concept.id).toBe('c1');
    expect(result.concept.name).toBe('Fractions');
    expect(result.relations).toEqual([]);
  });

  it('rejects missing concepts with NotFoundException', async () => {
    mockPrisma.learningConcept.findUnique.mockResolvedValue(null);

    await expect(service.getConcept('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns prerequisites for a concept', async () => {
    mockPrisma.learningConceptRelation.findMany.mockResolvedValue([
      {
        fromConceptId: 'numbers',
        toConceptId: 'fractions',
        relationType: 'PREREQUISITE',
        fromConcept: { id: 'numbers', name: 'Whole Numbers' },
      },
    ]);

    const result = await service.getPrerequisites('fractions');

    expect(result).toHaveLength(1);
    expect(result[0].relationType).toBe('PREREQUISITE');
    expect(result[0].fromConcept.name).toBe('Whole Numbers');
  });

  it('returns next candidates without automatically marking mastery (Hard Invariant)', async () => {
    mockPrisma.learningConceptRelation.findMany.mockResolvedValue([
      {
        fromConceptId: 'fractions',
        toConceptId: 'decimals',
        relationType: 'PREREQUISITE',
        toConcept: { id: 'decimals', name: 'Decimals' },
      },
    ]);

    const candidates = await service.getNextCandidates('fractions');

    expect(candidates).toHaveLength(1);
    expect(candidates[0].toConcept.id).toBe('decimals');
    // Ensure no mastery update method was called on prisma
    expect(mockPrisma.learningConcept.create).not.toHaveBeenCalled();
  });
});
