import { CanActivate, ForbiddenException, Injectable, Type } from '@nestjs/common';

/** Makes a guard that blocks a feature unless the named environment variable is exactly "true" (any case). */
export function featureFlagGuard(envName: string, message: string, className: string): Type<CanActivate> {
  @Injectable()
  class FeatureFlagGuard implements CanActivate {
    canActivate(): boolean {
      if ((process.env[envName] ?? 'false').toLowerCase() !== 'true') throw new ForbiddenException(message);
      return true;
    }
  }
  Object.defineProperty(FeatureFlagGuard, 'name', { value: className });
  return FeatureFlagGuard;
}

/** The discussion forum lets every logged-in student read every post and author name. Off unless ENABLE_FORUM=true. */
export const ForumFeatureGuard = featureFlagGuard('ENABLE_FORUM', 'The discussion forum is turned off for this deployment.', 'ForumFeatureGuard');
