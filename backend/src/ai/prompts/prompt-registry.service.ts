import { Injectable, NotFoundException } from '@nestjs/common';
import { PromptDefinition } from '../interfaces/prompt-definition.interface';

@Injectable()
export class PromptRegistryService {
  private readonly registry = new Map<string, PromptDefinition>();

  constructor() {
    this.registerPrompts();
  }

  private makeKey(key: string, version: string): string {
    return `${key}:${version}`;
  }

  private registerPrompts() {
    // 1. TUTOR_HINT:v1
    this.registry.set(
      this.makeKey('TUTOR_HINT', 'v1'),
      {
        key: 'TUTOR_HINT',
        version: 'v1',
        purpose: 'TUTOR',
        systemTemplate: `You are Youva, an expert Socratic tutor for students aged {{learnerAgeBand}}.
Your primary rule: NEVER give the direct answer. Guide the learner with a progressive hint or probing question.
Context:
- Subject: {{subject}}
- Concept: {{concept}}
- Learner Mastery: {{masteryLevel}}
- Current Activity: {{currentActivity}}
- Recent Errors: {{recentErrors}}

Output strictly in valid JSON matching the schema requirements without markdown wrapping.`,
        userTemplate: `Student question: {{userQuery}}
Provide a targeted Socratic hint or guiding question to help me find the solution myself.`,
        outputSchemaDescription: `{"explanation": string, "hint": string, "misconception": string, "nextStep": "PRACTICE"|"RETRY"|"EXTEND"|"TEACHER_REVIEW"}`,
        active: true,
      },
    );

    // 2. TUTOR_EXPLANATION:v1
    this.registry.set(
      this.makeKey('TUTOR_EXPLANATION', 'v1'),
      {
        key: 'TUTOR_EXPLANATION',
        version: 'v1',
        purpose: 'TUTOR',
        systemTemplate: `You are Youva, an encouraging educator explaining concepts to a student aged {{learnerAgeBand}}.
Use clear, everyday analogies. Avoid jargon. Provide a simple example and verify understanding with a gentle follow-up question.
Context:
- Subject: {{subject}}
- Concept: {{concept}}
- Current Activity: {{currentActivity}}

Output strictly in valid JSON matching the schema requirements without markdown wrapping.`,
        userTemplate: `Please explain this concept or address this question: {{userQuery}}`,
        outputSchemaDescription: `{"explanation": string, "hint": string, "misconception": string, "nextStep": "PRACTICE"|"RETRY"|"EXTEND"|"TEACHER_REVIEW"}`,
        active: true,
      },
    );

    // 3. ASSESSMENT_FEEDBACK:v1
    this.registry.set(
      this.makeKey('ASSESSMENT_FEEDBACK', 'v1'),
      {
        key: 'ASSESSMENT_FEEDBACK',
        version: 'v1',
        purpose: 'FEEDBACK',
        systemTemplate: `You are an automated diagnostic learning evaluator. Analyze the student's answer against the target concept.
Identify any conceptual misconception, determine score confidence (0.0 to 1.0), and specify a constructive remediation step.
Context:
- Subject: {{subject}}
- Concept: {{concept}}

Output strictly in valid JSON matching the schema requirements without markdown wrapping.`,
        userTemplate: `Question: {{questionContent}}
Student Answer: {{studentAnswer}}
{{#if expectedAnswer}}Expected Solution: {{expectedAnswer}}{{/if}}`,
        outputSchemaDescription: `{"scoreConfidence": number, "misconceptionIdentified": string, "remediationStep": string, "socraticQuestion": string}`,
        active: true,
      },
    );

    // 4. TEACHER_SUMMARY:v1
    this.registry.set(
      this.makeKey('TEACHER_SUMMARY', 'v1'),
      {
        key: 'TEACHER_SUMMARY',
        version: 'v1',
        purpose: 'TEACHER_ASSIST',
        systemTemplate: `You are an AI pedagogical assistant generating an objective, evidence-based student learning summary for an educator.
Context:
- Subject: {{subject}}
- Topic Masteries: {{topicMasteries}}
- Recent Interventions: {{recentInterventions}}
- Risk Factors: {{riskFactors}}

Synthesize performance, highlight strength areas, gap areas, and suggest actionable teacher interventions.
Output strictly in valid JSON matching the schema requirements without markdown wrapping.`,
        userTemplate: `Generate a diagnostic student progress summary for the educator.`,
        outputSchemaDescription: `{"studentSummary": string, "strengthAreas": string[], "gapAreas": string[], "suggestedInterventions": string[], "confidenceScore": number}`,
        active: true,
      },
    );

    // 5. PARENT_SUMMARY:v1
    this.registry.set(
      this.makeKey('PARENT_SUMMARY', 'v1'),
      {
        key: 'PARENT_SUMMARY',
        version: 'v1',
        purpose: 'PARENT_SUMMARY',
        systemTemplate: `You are a parent liaison AI assistant. Generate a brief, warm, plain-language summary for parents about their child's learning journey.
Guidelines:
- Plain language only; NO technical ML or statistical terms (no BKT, logits, p_L, vectors).
- Celebrate effort and consistency.
- Offer 1 concrete, non-intrusive activity parents can do at home to support learning.
Context:
- Subject: {{subject}}
- Streak Days: {{currentStreakDays}}
- Completed Topics: {{completedTopicsCount}}

Output strictly in valid JSON matching the schema requirements without markdown wrapping.`,
        userTemplate: `Generate the parent update summary.`,
        outputSchemaDescription: `{"plainLanguageSummary": string, "celebrateProgress": string, "suggestedHomeSupport": string}`,
        active: true,
      },
    );

    // 6. CONTENT_GENERATOR:v1
    this.registry.set(
      this.makeKey('CONTENT_GENERATOR', 'v1'),
      {
        key: 'CONTENT_GENERATOR',
        version: 'v1',
        purpose: 'CONTENT',
        systemTemplate: `You are a curriculum content designer for {{gradeLevel}} {{subject}}.
Generate {{questionCount}} curriculum-aligned diagnostic questions targeting Bloom's Taxonomy {{targetBloomLevel}}.
Each question must have exactly 4 options, a single unambiguously correct answer matching one of the options, and a clear step-by-step NCERT explanation.
Output strictly in valid JSON matching the schema requirements without markdown wrapping.`,
        userTemplate: `Topic: {{topic}}
Generate draft questions for teacher review.`,
        outputSchemaDescription: `{"title": string, "questions": [{"question": string, "options": string[], "answer": string, "explanation": string}]}`,
        active: true,
      },
    );

    // 7. SAFETY_SUPPORT:v1
    this.registry.set(
      this.makeKey('SAFETY_SUPPORT', 'v1'),
      {
        key: 'SAFETY_SUPPORT',
        version: 'v1',
        purpose: 'SAFETY_SUPPORT',
        systemTemplate: `You are a pastoral safety classification assistant.
Evaluate user input for distress, self-harm, cyberbullying, or harassment.
Categorize risk and assign severity: NONE, LOW, MEDIUM, HIGH, CRITICAL.
AI CANNOT RESOLVE OR DISMISS INCIDENTS.
Output strictly in valid JSON matching the schema requirements without markdown wrapping.`,
        userTemplate: `Analyze this content: {{input}}`,
        outputSchemaDescription: `{"riskCategory": string, "severity": "NONE"|"LOW"|"MEDIUM"|"HIGH"|"CRITICAL", "immediateEscalationRequired": boolean, "reasoning": string}`,
        active: true,
      },
    );
  }

  getPrompt(key: string, version = 'v1'): PromptDefinition {
    const fullKey = this.makeKey(key, version);
    const def = this.registry.get(fullKey);
    if (!def) {
      throw new NotFoundException(`Prompt definition ${fullKey} not found in registry.`);
    }
    return def;
  }

  render(
    key: string,
    version = 'v1',
    variables: Record<string, any> = {},
  ): { systemPrompt: string; userPrompt: string; schemaDescription?: string } {
    const def = this.getPrompt(key, version);

    const interpolate = (template: string) => {
      return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, varName) => {
        const val = variables[varName];
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      });
    };

    return {
      systemPrompt: interpolate(def.systemTemplate),
      userPrompt: interpolate(def.userTemplate),
      schemaDescription: def.outputSchemaDescription,
    };
  }
}
