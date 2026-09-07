import { AsyncLocalStorage } from 'async_hooks';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';

export interface TenantContextData {
  tenantId: string;
  role?: string;
  userId?: string;
}

const tenantStorage = new AsyncLocalStorage<TenantContextData>();

export class TenantContext {
  /**
   * Run a callback inside an isolated tenant context.
   */
  static run<T>(data: TenantContextData, fn: () => T): T {
    return tenantStorage.run(data, fn);
  }

  /**
   * Get the current active tenant data from context, if present.
   */
  static get(): TenantContextData | undefined {
    return tenantStorage.getStore();
  }

  /**
   * Get the current tenant ID, returning undefined if no tenant is set.
   */
  static getTenantId(): string | undefined {
    return tenantStorage.getStore()?.tenantId;
  }

  /**
   * Enforce that a valid tenant context is active, throwing ForbiddenException otherwise.
   */
  static requireTenantId(): string {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context is required for this operation');
    }
    return tenantId;
  }
}
