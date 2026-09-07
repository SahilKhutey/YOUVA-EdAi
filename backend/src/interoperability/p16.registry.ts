import { Injectable } from '@nestjs/common';
import {
  ExternalIntegrationAdapter,
} from './p16.types';

@Injectable()
export class IntegrationAdapterRegistry {
  private readonly adapters =
    new Map<
      string,
      ExternalIntegrationAdapter
    >();

  register(
    adapter: ExternalIntegrationAdapter,
  ): void {
    if (
      this.adapters.has(adapter.provider)
    ) {
      throw new Error(
        `Adapter already registered: ${adapter.provider}`,
      );
    }

    this.adapters.set(
      adapter.provider,
      adapter,
    );
  }

  get(
    provider: string,
  ): ExternalIntegrationAdapter {
    const adapter =
      this.adapters.get(provider);

    if (!adapter) {
      throw new Error(
        `Unsupported integration provider: ${provider}`,
      );
    }

    return adapter;
  }

  has(provider: string): boolean {
    return this.adapters.has(provider);
  }
}
