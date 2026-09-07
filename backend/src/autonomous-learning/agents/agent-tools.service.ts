import { Injectable, ForbiddenException } from '@nestjs/common';

export const TOOLS = {
  LEARNING_AGENT: [
    'read_curriculum',
    'read_mastery',
    'recommend_activity',
  ],
  TEACHER_AGENT: [
    'read_class_analytics',
    'draft_intervention',
  ],
  CONTENT_AGENT: [
    'read_curriculum',
    'draft_content',
  ],
} as const;

export type AgentRole = keyof typeof TOOLS;

@Injectable()
export class AgentToolsService {
  /**
   * Verifies if an agent role is permitted to invoke a tool.
   * Invariant: Wildcard tool access ('*') is strictly forbidden.
   */
  isToolAllowed(role: AgentRole, toolName: string): boolean {
    if (toolName === '*' || toolName.includes('*')) {
      return false;
    }
    const allowed = TOOLS[role] as readonly string[] | undefined;
    return Boolean(allowed && allowed.includes(toolName));
  }

  assertToolAllowed(role: AgentRole, toolName: string) {
    if (!this.isToolAllowed(role, toolName)) {
      throw new ForbiddenException(`Tool '${toolName}' is not permitted for role '${role}'.`);
    }
  }
}
