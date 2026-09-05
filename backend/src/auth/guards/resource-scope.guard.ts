import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ScopeAuthorizationService } from '../services/scope-authorization.service';

@Injectable()
export class ResourceScopeGuard implements CanActivate {
  constructor(private readonly scopeAuthService: ScopeAuthorizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Admins bypass resource checks
    if (user.role === 'ADMIN') {
      return true;
    }

    // Extract studentId from params, body, or query
    const targetStudentId =
      request.params?.studentId ||
      request.params?.id ||
      request.body?.studentId ||
      request.query?.studentId;

    if (user.role === 'TEACHER' && targetStudentId) {
      await this.scopeAuthService.assertTeacherStudentScope(user.id, targetStudentId);
      return true;
    }

    // If student role, ensure student is accessing only their own resources
    if (user.role === 'STUDENT' && targetStudentId && targetStudentId !== user.id) {
      throw new ForbiddenException('Access Denied: Students can only access their own learning resources.');
    }

    return true;
  }
}
