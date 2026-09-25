import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '../../auth/role.enum';

@Injectable()
export class KnowledgeAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User authentication required');
    }

    // Attach tenantId from headers or user profile
    const tenantId = request.headers['x-tenant-id'] || user.tenantId || 'default-tenant';
    request.tenantId = tenantId;

    return true;
  }
}
