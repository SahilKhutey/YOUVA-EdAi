import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AiCoachInteraction } from './n20-types';
import { CapabilityGraphService } from './capability-graph.service';

@Injectable()
export class AiCapabilityCoachService {
  private interactions: Map<string, AiCoachInteraction> = new Map();

  constructor(private readonly capabilityGraph: CapabilityGraphService) {
    this.seedInitialInteractions();
  }

  private seedInitialInteractions(): void {
    const seed: AiCoachInteraction = {
      id: 'coach-int-001',
      learnerId: 'learner-alex-001',
      capabilityId: 'cap-dist-sys-101',
      prompt: 'How do I handle network splits in my Raft implementation without losing linearizability?',
      guidanceText:
        'Focus on lease read timers and state machine terms before acknowledging write quorums. Consider what happens when the majority partition cannot contact the old leader.',
      metacognitiveReflectionPrompt:
        'Reflect on your previous attempt: Which state transition caused the stale read, and how does your term check prevent it?',
      scaffoldingLevel: 'SCAFFOLDED',
      aiRemovalTestApplied: false,
      aiDependencyFlagged: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    };
    this.interactions.set(seed.id, seed);
  }

  public requestCoaching(dto: {
    learnerId: string;
    capabilityId: string;
    prompt: string;
    scaffoldingPreference?: 'NONE' | 'SCAFFOLDED' | 'INDEPENDENT_CHALLENGE';
  }): AiCoachInteraction {
    if (!dto.learnerId || !dto.capabilityId || !dto.prompt) {
      throw new BadRequestException('Learner ID, capability ID, and prompt are required');
    }

    const cap = this.capabilityGraph.getCapability(dto.capabilityId);

    // Enforce Invariant 3: Prohibit consequential autonomous determinations
    this.assertNoConsequentialDecisions(dto.prompt);

    const scaffoldingLevel = dto.scaffoldingPreference || 'SCAFFOLDED';
    const id = `coach-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Generate metacognitive reflection prompts
    const metacognitiveReflectionPrompt = `Metacognitive Check: Explain why you chose this design path for ${cap.title}. What assumptions did you make, and how would you verify them if all AI tools were disabled?`;

    const interaction: AiCoachInteraction = {
      id,
      learnerId: dto.learnerId,
      capabilityId: dto.capabilityId,
      prompt: dto.prompt,
      guidanceText: `AI Capability Coach Advisory: For ${cap.title}, remember that true mastery requires conceptual transfer. Analyze the problem constraints, articulate edge cases, and verify boundary conditions independently.`,
      metacognitiveReflectionPrompt,
      scaffoldingLevel,
      aiRemovalTestApplied: false,
      aiDependencyFlagged: false,
      createdAt: new Date().toISOString(),
    };

    this.interactions.set(id, interaction);
    return interaction;
  }

  // --- Clause N20.138: AI Removal Test ---

  public runAiRemovalTest(interactionId: string, unassistedScore: number, assistedScore: number): AiCoachInteraction {
    const interaction = this.interactions.get(interactionId);
    if (!interaction) {
      throw new NotFoundException(`Coaching interaction ${interactionId} not found`);
    }

    if (assistedScore <= 0) {
      throw new BadRequestException('Assisted score must be greater than zero');
    }

    const performanceDropPct = Math.max(0, Math.round(((assistedScore - unassistedScore) / assistedScore) * 100));
    interaction.aiRemovalTestApplied = true;
    interaction.performanceDropPct = performanceDropPct;

    // Clause N20.138: Drop > 35% flags dependency
    if (performanceDropPct > 35) {
      interaction.aiDependencyFlagged = true;
      interaction.guidanceText +=
        ' [FLAG: AI Dependency Detected (>35% unassisted drop). Pathway adjusted to prioritize unassisted problem-solving exercises.]';
    } else {
      interaction.aiDependencyFlagged = false;
    }

    this.interactions.set(interactionId, interaction);
    return interaction;
  }

  // --- Clause N20.179: Human Teacher / Mentor Override ---

  public applyTeacherOverride(
    interactionId: string,
    teacherId: string,
    reasonCode: 'PEDAGOGICAL_DISCRETION' | 'AUTHENTIC_CONTEXT_VARIATION' | 'LEARNER_REQUESTED_DIVERGENCE' | 'SPECIALIZED_NEEDS',
    overrideNotes: string
  ): AiCoachInteraction {
    const interaction = this.interactions.get(interactionId);
    if (!interaction) {
      throw new NotFoundException(`Coaching interaction ${interactionId} not found`);
    }

    interaction.teacherOverrideReason = `Teacher ${teacherId} override [${reasonCode}]: ${overrideNotes}`;
    this.interactions.set(interactionId, interaction);
    return interaction;
  }

  public getInteractions(learnerId?: string): AiCoachInteraction[] {
    const list = Array.from(this.interactions.values());
    if (learnerId) {
      return list.filter((i) => i.learnerId === learnerId);
    }
    return list;
  }

  private assertNoConsequentialDecisions(prompt: string): void {
    const prohibitedKeywords = [
      /hire\s+candidate/i,
      /reject\s+applicant/i,
      /deny\s+credential/i,
      /revoke\s+degree/i,
      /admit\s+student/i,
      /expel\s+learner/i,
    ];

    for (const pattern of prohibitedKeywords) {
      if (pattern.test(prompt)) {
        throw new ForbiddenException(
          'CONSTITUTIONAL VIOLATION (Clause N20.137): The AI Capability Coach is strictly advisory. It cannot execute consequential hiring, admissions, or credential decisions.'
        );
      }
    }
  }
}
