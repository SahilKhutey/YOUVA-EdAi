export type Entitlement =
  | 'BASIC_LEARNING'
  | 'AI_TUTOR'
  | 'ADAPTIVE_PRACTICE'
  | 'PARENT_PROGRESS'
  | 'ADVANCED_PERSONALIZATION'
  | 'ADVANCED_ANALYTICS'
  | 'TEACHER_WORKSPACE'
  | 'CLASSROOM_MANAGEMENT'
  | 'SCHOOL_ANALYTICS'
  | 'ENTERPRISE_GOVERNANCE';

export interface EntitlementResponse {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  entitlements: Entitlement[];
}

export function hasEntitlement(
  data: EntitlementResponse | null,
  entitlement: Entitlement,
): boolean {
  if (!data || data.status !== 'ACTIVE') {
    return false;
  }

  return data.entitlements.includes(entitlement);
}
