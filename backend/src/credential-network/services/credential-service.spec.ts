import { CredentialService } from './credential.service';
import { NotFoundException } from '@nestjs/common';

describe('CredentialService Tenant Isolation', () => {
  it('enforces tenant isolation and rejects cross-tenant credential access', async () => {
    const mockPrisma = {
      learningCredential: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'cred-1' && where.tenantId === 'tenant-alpha') {
            return Promise.resolve({ id: 'cred-1', tenantId: 'tenant-alpha' });
          }
          return Promise.resolve(null);
        }),
      },
    };

    const service = new CredentialService(mockPrisma as any);

    // Valid tenant access
    const cred = await service.getCredential('cred-1', 'tenant-alpha');
    expect(cred).toBeDefined();
    expect(cred.id).toBe('cred-1');

    // Cross-tenant access attempt
    await expect(
      service.getCredential('cred-1', 'tenant-beta'),
    ).rejects.toThrow(NotFoundException);
  });
});
