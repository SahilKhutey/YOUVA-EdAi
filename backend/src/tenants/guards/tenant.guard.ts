import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { TENANT_ROLES_KEY } from '../decorators/tenant-roles.decorator';
import { TenantContext } from '../tenant.context';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('Authentication required to access tenant resources');
    }

    // Resolve tenant identifier from headers, route parameters, or query string
    const tenantId =
      request.headers['x-tenant-id'] ||
      request.params?.tenantId ||
      (request.route?.path?.includes('/tenants/:id') ? request.params?.id : undefined) ||
      request.query?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Missing tenant identifier (x-tenant-id header or parameter)');
    }

    // System platform administrators have universal tenant oversight
    if (user.role === 'ADMIN') {
      request.tenantContext = {
        tenantId,
        role: 'TENANT_ADMIN',
        userId: user.id,
      };
      return true;
    }

    // Verify active membership in tenant
    const membership = await this.prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: user.id,
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException(`User does not hold an active membership in tenant [${tenantId}]`);
    }

    // Verify required role if specified via @TenantRoles
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      TENANT_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.includes(membership.role);
      if (!hasRequiredRole) {
        throw new ForbiddenException(
          `Insufficient tenant role. Required: [${requiredRoles.join(', ')}], actual: [${membership.role}]`,
        );
      }
    }

    // Attach tenant context to the HTTP request
    request.tenantContext = {
      tenantId,
      role: membership.role,
      userId: user.id,
    };

    return true;
  }
}
