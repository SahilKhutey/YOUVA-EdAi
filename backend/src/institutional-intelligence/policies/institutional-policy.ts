import { ForbiddenException, BadRequestException } from '@nestjs/common';

export class InstitutionalPolicy {
  public static readonly MIN_SYSTEMIC_SAMPLE_SIZE = 30;
  public static readonly MIN_SYSTEMIC_COHORTS = 3;
  public static readonly MAX_TRAVERSAL_DEPTH = 4;

  /**
   * Validates if data volume meets institutional confidence thresholds.
   */
  static validateSystemicThreshold(affectedLearnerCount: number, affectedCourseCount: number): void {
    if (
      affectedLearnerCount < this.MIN_SYSTEMIC_SAMPLE_SIZE ||
      affectedCourseCount < this.MIN_SYSTEMIC_COHORTS
    ) {
      throw new BadRequestException(
        `Threshold check failed: Systemic insights require at least ${this.MIN_SYSTEMIC_SAMPLE_SIZE} learners across ${this.MIN_SYSTEMIC_COHORTS} courses/cohorts (current: ${affectedLearnerCount} learners, ${affectedCourseCount} courses).`,
      );
    }
  }

  /**
   * Validates access permissions based on user role.
   */
  static validateRoleAccess(role: string, requestedScope: 'INSTITUTIONAL' | 'CLASSROOM'): void {
    if (role === 'STUDENT') {
      throw new ForbiddenException('Access Denied: Students cannot access institutional intelligence.');
    }

    if (role === 'TEACHER' && requestedScope === 'INSTITUTIONAL') {
      throw new ForbiddenException(
        'Access Denied: Teachers are restricted to their authorized instructional scope.',
      );
    }
  }

  /**
   * Clamps network traversal depth to prevent unbounded graph traversal.
   */
  static clampTraversalDepth(requestedDepth?: number): number {
    if (!requestedDepth || requestedDepth < 1) return 1;
    return Math.min(requestedDepth, this.MAX_TRAVERSAL_DEPTH);
  }
}
