import { Test, TestingModule } from '@nestjs/testing';
import { GraphTraversalService } from '../graph-traversal.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('GraphTraversalService', () => {
  let service: GraphTraversalService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      knowledgeRelationship: {
        findMany: jest.fn(),
      },
      knowledgeObject: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphTraversalService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<GraphTraversalService>(GraphTraversalService);
  });

  describe('getPrerequisites', () => {
    it('should return direct published prerequisites', async () => {
      // Linear Equations (target) has incoming prerequisite Variables (source)
      prisma.knowledgeRelationship.findMany.mockResolvedValueOnce([
        {
          source: {
            id: 'var-1',
            title: 'Variables',
            type: 'CONCEPT',
            status: 'PUBLISHED',
            slug: 'variables',
            currentVersion: 1,
          },
        },
      ]);
      // Second hop returns empty
      prisma.knowledgeRelationship.findMany.mockResolvedValueOnce([]);

      const prereqs = await service.getPrerequisites('linear-eq-1', {
        publishedOnly: true,
        maxDepth: 3,
      });

      expect(prereqs).toHaveLength(1);
      expect(prereqs[0].id).toBe('var-1');
      expect(prereqs[0].title).toBe('Variables');
    });

    it('should filter out unpublished prerequisites when publishedOnly is true', async () => {
      prisma.knowledgeRelationship.findMany.mockResolvedValueOnce([
        {
          source: {
            id: 'draft-prereq',
            title: 'Draft Prereq',
            type: 'CONCEPT',
            status: 'DRAFT',
            slug: 'draft-prereq',
            currentVersion: 1,
          },
        },
      ]);

      const prereqs = await service.getPrerequisites('target-1', {
        publishedOnly: true,
      });

      expect(prereqs).toHaveLength(0);
    });

    it('should traverse multi-hop prerequisites up to maxDepth and deduplicate nodes', async () => {
      // Target: C.
      // Hop 1 (target C): prerequisites are A and B
      // Hop 2 (target A): prerequisite is D
      // Hop 3 (target B): prerequisite is D (diamond pattern: both A and B require D)
      prisma.knowledgeRelationship.findMany.mockImplementation((args: any) => {
        if (args.where.targetId === 'C') {
          return Promise.resolve([
            {
              source: {
                id: 'A',
                title: 'A',
                type: 'CONCEPT',
                status: 'PUBLISHED',
                slug: 'a',
                currentVersion: 1,
              },
            },
            {
              source: {
                id: 'B',
                title: 'B',
                type: 'CONCEPT',
                status: 'PUBLISHED',
                slug: 'b',
                currentVersion: 1,
              },
            },
          ]);
        }
        if (args.where.targetId === 'A' || args.where.targetId === 'B') {
          return Promise.resolve([
            {
              source: {
                id: 'D',
                title: 'D',
                type: 'CONCEPT',
                status: 'PUBLISHED',
                slug: 'd',
                currentVersion: 1,
              },
            },
          ]);
        }
        return Promise.resolve([]);
      });

      const prereqs = await service.getPrerequisites('C', { maxDepth: 3 });
      const ids = prereqs.map((p) => p.id);

      // Must include A, B, and D with NO duplicates
      expect(ids).toContain('A');
      expect(ids).toContain('B');
      expect(ids).toContain('D');
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('getDependents', () => {
    it('should return downstream dependent concepts', async () => {
      // Variables (source) is prerequisite for Linear Equations (target)
      prisma.knowledgeRelationship.findMany.mockResolvedValueOnce([
        {
          target: {
            id: 'linear-eq-1',
            title: 'Linear Equations',
            type: 'LESSON',
            status: 'PUBLISHED',
            slug: 'linear-equations',
            currentVersion: 1,
          },
        },
      ]);
      prisma.knowledgeRelationship.findMany.mockResolvedValueOnce([]);

      const dependents = await service.getDependents('variables-1', { maxDepth: 1 });
      expect(dependents).toHaveLength(1);
      expect(dependents[0].id).toBe('linear-eq-1');
    });
  });

  describe('findPath', () => {
    it('should find the shortest prerequisite path from source to target', async () => {
      // A -> B -> C
      prisma.knowledgeRelationship.findMany.mockImplementation((args: any) => {
        if (args.where.sourceId === 'A') return Promise.resolve([{ targetId: 'B' }]);
        if (args.where.sourceId === 'B') return Promise.resolve([{ targetId: 'C' }]);
        return Promise.resolve([]);
      });

      prisma.knowledgeObject.findMany.mockResolvedValue([
        { id: 'A', title: 'A', type: 'CONCEPT', status: 'PUBLISHED', slug: 'a', currentVersion: 1 },
        { id: 'B', title: 'B', type: 'CONCEPT', status: 'PUBLISHED', slug: 'b', currentVersion: 1 },
        { id: 'C', title: 'C', type: 'CONCEPT', status: 'PUBLISHED', slug: 'c', currentVersion: 1 },
      ]);

      const path = await service.findPath('A', 'C');
      expect(path.map((p) => p.id)).toEqual(['A', 'B', 'C']);
    });
  });
});
