import {
  IntegrationAdapterRegistry,
} from './p16.registry';

describe(
  'IntegrationAdapterRegistry',
  () => {
    const adapter = {
      provider: 'TEST',
      testConnection: jest.fn(),
      pull: jest.fn(),
      push: jest.fn(),
    };

    it(
      'registers and resolves an adapter',
      () => {
        const registry =
          new IntegrationAdapterRegistry();

        registry.register(adapter);

        expect(
          registry.get('TEST'),
        ).toBe(adapter);

        expect(
          registry.has('TEST'),
        ).toBe(true);
      },
    );

    it(
      'rejects duplicate providers',
      () => {
        const registry =
          new IntegrationAdapterRegistry();

        registry.register(adapter);

        expect(() =>
          registry.register(adapter),
        ).toThrow(
          'already registered',
        );
      },
    );

    it(
      'rejects unsupported providers',
      () => {
        const registry =
          new IntegrationAdapterRegistry();

        expect(() =>
          registry.get('MISSING'),
        ).toThrow(
          'Unsupported integration provider',
        );
      },
    );
  },
);
