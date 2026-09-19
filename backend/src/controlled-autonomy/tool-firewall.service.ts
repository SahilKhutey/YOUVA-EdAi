import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ToolDefinition } from './n15-types';

@Injectable()
export class ToolFirewallService {
  private readonly logger = new Logger(ToolFirewallService.name);
  private tools: Map<string, ToolDefinition> = new Map();
  private toolUsageCounters: Map<string, number> = new Map();

  constructor() {
    this.seedCanonicalTools();
  }

  private seedCanonicalTools() {
    const searchTool: ToolDefinition = {
      toolId: 'tool-curriculum-search',
      name: 'Curriculum Knowledge Search',
      scope: 'READ_APPROVED_CURRICULUM',
      riskClass: 'LOW',
      rateLimitPerMin: 60,
      requiresHumanAuth: false,
      allowedTenantScopes: ['*'],
    };

    const analyticsTool: ToolDefinition = {
      toolId: 'tool-learning-analytics',
      name: 'Cohort Learning Analytics Reader',
      scope: 'READ_ANALYTICS_AGGREGATES',
      riskClass: 'LOW',
      rateLimitPerMin: 30,
      requiresHumanAuth: false,
      allowedTenantScopes: ['*'],
    };

    const notificationTool: ToolDefinition = {
      toolId: 'tool-routine-notification',
      name: 'Schedule Routine Revision Notification',
      scope: 'SCHEDULE_NOTIFICATION',
      riskClass: 'MEDIUM',
      rateLimitPerMin: 15,
      requiresHumanAuth: false,
      allowedTenantScopes: ['*'],
    };

    const contentGenTool: ToolDefinition = {
      toolId: 'tool-practice-generator',
      name: 'Formative Practice Question Generator',
      scope: 'GENERATE_PRACTICE_VARIANT',
      riskClass: 'MEDIUM',
      rateLimitPerMin: 20,
      requiresHumanAuth: false,
      allowedTenantScopes: ['*'],
    };

    this.tools.set(searchTool.toolId, searchTool);
    this.tools.set(analyticsTool.toolId, analyticsTool);
    this.tools.set(notificationTool.toolId, notificationTool);
    this.tools.set(contentGenTool.toolId, contentGenTool);
  }

  // --- 1. Tool Firewall & Execution Mediation (Clause N15.13) ---

  public executeTool(params: {
    toolId: string;
    agentId: string;
    tenantId: string;
    inputPayload: Record<string, any>;
  }): { output: any; status: 'SUCCESS'; rateLimitRemaining: number } {
    const tool = this.tools.get(params.toolId);
    if (!tool) {
      throw new BadRequestException(`TOOL-001: Tool [${params.toolId}] not registered in firewall`);
    }

    // Tenant Scope Verification
    if (
      !tool.allowedTenantScopes.includes('*') &&
      !tool.allowedTenantScopes.includes(params.tenantId)
    ) {
      throw new ForbiddenException(
        `TOOL-002: Tenant [${params.tenantId}] is not authorized to invoke tool [${params.toolId}]`
      );
    }

    // Rate Limit Gate
    const key = `${params.agentId}:${params.toolId}`;
    const current = (this.toolUsageCounters.get(key) || 0) + 1;
    this.toolUsageCounters.set(key, current);

    if (current > tool.rateLimitPerMin) {
      throw new ForbiddenException(
        `TOOL-003: Rate limit exceeded for tool [${params.toolId}] (${current}/${tool.rateLimitPerMin} req/min)`
      );
    }

    // Input Validation: Check for DB credential/injection patterns
    this.sanitizeInputPayload(params.inputPayload);

    // Mock Tool Execution (Controlled Sandbox)
    let output: any;
    if (params.toolId === 'tool-curriculum-search') {
      output = {
        results: [
          { topicId: 'MATH-LINEQ-01', title: 'Linear Equations in One Variable', difficulty: 0.45 },
          { topicId: 'MATH-LINEQ-02', title: 'Two-Variable Equations', difficulty: 0.65 },
        ],
      };
    } else if (params.toolId === 'tool-routine-notification') {
      output = { scheduled: true, deliveryTime: new Date(Date.now() + 3600000).toISOString() };
    } else {
      output = { processed: true, echo: params.inputPayload };
    }

    return {
      output,
      status: 'SUCCESS',
      rateLimitRemaining: tool.rateLimitPerMin - current,
    };
  }

  // --- 2. Direct Database & Filesystem Access Prohibition (Clause N15.14) ---

  public sanitizeInputPayload(payload: Record<string, any>): void {
    const stringified = JSON.stringify(payload);

    // Block arbitrary SQL patterns
    const dangerousSql = /\b(DROP\s+TABLE|DELETE\s+FROM|UPDATE\s+.*SET|TRUNCATE|ALTER\s+TABLE|UNION\s+SELECT)\b/i;
    if (dangerousSql.test(stringified)) {
      throw new ForbiddenException('TOOL-004: Direct database mutation patterns rejected by tool firewall');
    }

    // Block arbitrary Redis commands
    const dangerousRedis = /\b(FLUSHALL|FLUSHDB|KEYS\s+\*|CONFIG\s+SET|SHUTDOWN)\b/i;
    if (dangerousRedis.test(stringified)) {
      throw new ForbiddenException('TOOL-005: Arbitrary Redis administrative commands rejected by tool firewall');
    }

    // Block filesystem/OS shell commands
    const dangerousShell = /(\/bin\/sh|\/bin\/bash|cmd\.exe|powershell|rm\s+-rf|cat\s+\/etc\/passwd)/i;
    if (dangerousShell.test(stringified)) {
      throw new ForbiddenException('TOOL-006: Direct filesystem/shell access rejected by tool firewall');
    }
  }

  // --- 3. Prompt Injection Defense & Instruction Hierarchy (Clauses N15.15 - N15.16) ---

  public validateExternalContent(untrustedText: string): {
    isSafeData: boolean;
    injectionDetected: boolean;
    sanitizedContent: string;
  } {
    if (!untrustedText) {
      return { isSafeData: true, injectionDetected: false, sanitizedContent: '' };
    }

    // Patterns attempting to override platform safety or grant autonomous authority
    const injectionPatterns = [
      /ignore\s+(all\s+)?(previous\s+)?instructions/i,
      /you\s+are\s+now\s+in\s+developer\s+mode/i,
      /system\s+override/i,
      /bypass\s+(safety|governance|auth|credential)/i,
      /bypass\s+.*credential/i,
      /issue\s+.*(credential|badge)/i,
      /issue\s+(this\s+)?credential\s+now/i,
      /override\s+mastery/i,
      /close\s+this\s+safety\s+incident/i,
      /grant\s+(me\s+)?admin\s+privileges/i,
    ];

    const matched = injectionPatterns.some((pattern) => pattern.test(untrustedText));

    if (matched) {
      this.logger.warn(`INJ-001: Prompt injection attempt detected: [${untrustedText.slice(0, 60)}...]`);
      // Invariant N15.15: External instructions are treated strictly as data, never as authority
      return {
        isSafeData: false,
        injectionDetected: true,
        sanitizedContent: '[UNTRUSTED_CONTENT_FLAGGED_AND_STRIPPED]',
      };
    }

    return {
      isSafeData: true,
      injectionDetected: false,
      sanitizedContent: untrustedText,
    };
  }

  // --- 4. SSRF & Network Boundary Protection (Clause N15.95) ---

  public validateOutboundUrl(targetUrl: string): boolean {
    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      throw new BadRequestException('NET-001: Malformed outbound URL');
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      throw new ForbiddenException('NET-002: SSRF defense: localhost is strictly blocked');
    }

    // Block cloud metadata endpoints
    if (hostname === '169.254.169.254' || hostname.includes('metadata.google.internal')) {
      throw new ForbiddenException('NET-003: SSRF defense: cloud metadata endpoints are strictly blocked');
    }

    // Block private IP ranges
    if (
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      throw new ForbiddenException('NET-004: SSRF defense: private IP network addresses are strictly blocked');
    }

    return true;
  }

  public resetRateLimits(): void {
    this.toolUsageCounters.clear();
  }
}
