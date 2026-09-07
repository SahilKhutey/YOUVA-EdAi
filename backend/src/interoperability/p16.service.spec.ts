import {
  NotFoundException,
} from '@nestjs/common';

import {
  InteroperabilityService,
} from './p16.service';

describe(
  'InteroperabilityService',
  () => {
    const prisma = {
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
    } as any;

    const registry = {
      has: jest.fn(),
      get: jest.fn(),
    } as any;

    let service:
      InteroperabilityService;

    beforeEach(() => {
      jest.clearAllMocks();

      service =
        new InteroperabilityService(
          prisma,
          registry,
        );
    });

    it(
      'rejects missing tenant membership',
      async () => {
        prisma.$queryRaw.mockResolvedValueOnce(
          [],
        );

        await expect(
          service.assertTenantMember(
            'u1',
            't1',
          ),
        ).rejects.toThrow(
          NotFoundException,
        );
      },
    );

    it(
      'creates tenant and owner membership',
      async () => {
        prisma.$queryRaw.mockResolvedValueOnce(
          [{ id: 't1' }],
        );

        prisma.$executeRaw.mockResolvedValueOnce(
          1,
        );

        await expect(
          service.createTenant(
            'u1',
            'Example School',
          ),
        ).resolves.toEqual({
          tenantId: 't1',
        });

        expect(
          prisma.$executeRaw,
        ).toHaveBeenCalled();
      },
    );

    it(
      'rejects unsupported providers',
      async () => {
        prisma.$queryRaw.mockResolvedValueOnce(
          [{ id: 'membership' }],
        );

        registry.has.mockReturnValue(
          false,
        );

        await expect(
          service.createIntegration(
            'u1',
            't1',
            {
              provider: 'NOPE',
              name: 'Integration',
              config: {
                baseUrl:
                  'https://lms.example.com',
              },
            },
          ),
        ).rejects.toThrow(
          'Unsupported provider',
        );
      },
    );

    it(
      'rejects an external record from another integration',
      async () => {
        prisma.$queryRaw
          .mockResolvedValueOnce([
            { id: 'membership' },
          ])
          .mockResolvedValueOnce([
            {
              id: 'i1',
              tenant_id: 't1',
              provider: 'TEST',
              name: 'LMS',
              status: 'ACTIVE',
              config_json: '{}',
              capabilities_json: '[]',
            },
          ])
          .mockResolvedValueOnce([
            { cursor: null },
          ]);

        registry.get.mockReturnValue({
          pull: jest.fn()
            .mockResolvedValue({
              records: [
                {
                  source: {
                    provider: 'TEST',
                    integrationId:
                      'OTHER',
                    recordId: 'r1',
                  },
                  entity: {
                    type: 'GRADE',
                  },
                  payload: {
                    score: 80,
                  },
                  provenance: {
                    importedAt:
                      new Date().toISOString(),
                    mappingVersion: 1,
                  },
                },
              ],
              hasMore: false,
            }),
        });

        const result =
          await service.importOnce(
            'u1',
            't1',
            'i1',
          );

        expect(
          result.rejected,
        ).toBe(1);

        expect(
          prisma.$executeRaw,
        ).toHaveBeenCalledTimes(1);
      },
    );
  },
);
