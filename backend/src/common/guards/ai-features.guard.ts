import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Blocks endpoints where a student's free text or voice reaches an AI provider.
 * Off unless ENABLE_AI_FEATURES=true, so a pilot cannot hit them by accident or by calling the API directly.
 */
@Injectable()
export class AiFeaturesGuard implements CanActivate {
  canActivate(): boolean {
    if ((process.env.ENABLE_AI_FEATURES ?? 'false').toLowerCase() !== 'true') {
      throw new ForbiddenException('AI features are turned off for this deployment.');
    }
    return true;
  }
}
