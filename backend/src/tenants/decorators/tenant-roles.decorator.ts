import { SetMetadata } from '@nestjs/common';

export const TENANT_ROLES_KEY = 'tenant_roles';

export enum TenantRole {
  TENANT_ADMIN = 'TENANT_ADMIN',
  PRINCIPAL = 'PRINCIPAL',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  CURRICULUM_DIRECTOR = 'CURRICULUM_DIRECTOR',
}

export const TenantRoles = (...roles: (TenantRole | string)[]) =>
  SetMetadata(TENANT_ROLES_KEY, roles);
