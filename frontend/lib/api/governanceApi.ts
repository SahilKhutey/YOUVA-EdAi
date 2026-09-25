import api from '../axios';

export interface GovernancePolicy {
  id: string;
  tenantId?: string;
  policyType: string;
  version: string;
  status: 'DRAFT' | 'ACTIVE' | 'RETIRED';
  rules: string;
  effectiveAt?: string;
  createdBy?: string;
  createdAt: string;
}

export interface GovernanceIssue {
  id: string;
  tenantId?: string;
  category: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  code: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  ownerId?: string;
  status: 'DETECTED' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  details?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface DataQualityCheckResult {
  checkedAt: string;
  issuesDetected: number;
  issues: GovernanceIssue[];
}

export const governanceApi = {
  /**
   * Retrieves active and historical governance policies.
   */
  async getPolicies(): Promise<GovernancePolicy[]> {
    const res = await api.get('/v1/governance/policies');
    return res.data;
  },

  /**
   * Activates a governance policy version, retiring older versions.
   */
  async activatePolicy(id: string): Promise<GovernancePolicy> {
    const res = await api.post(`/v1/governance/policies/${id}/activate`);
    return res.data;
  },

  /**
   * Retrieves governance issues and data quality alerts.
   */
  async getIssues(status?: string): Promise<GovernanceIssue[]> {
    const res = await api.get('/v1/governance/issues', {
      params: status ? { status } : {},
    });
    return res.data;
  },

  /**
   * Acknowledges a governance issue.
   */
  async acknowledgeIssue(id: string, ownerId: string): Promise<any> {
    const res = await api.post(`/v1/governance/issues/${id}/acknowledge`, { ownerId });
    return res.data;
  },

  /**
   * Resolves a governance issue.
   */
  async resolveIssue(id: string): Promise<any> {
    const res = await api.post(`/v1/governance/issues/${id}/resolve`);
    return res.data;
  },

  /**
   * Runs automated data quality engine checks.
   */
  async runDataQualityChecks(): Promise<DataQualityCheckResult> {
    const res = await api.post('/v1/governance/data-quality-checks');
    return res.data;
  },
};
