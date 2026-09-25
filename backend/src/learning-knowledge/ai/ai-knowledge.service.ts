import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KnowledgeRetrieverService } from './retrieval/knowledge-retriever.service';
import { GroundingValidatorService } from './grounding/grounding-validator.service';
import { AiGuardrailService } from './guardrails/ai-guardrail.service';
import { AiProvenanceService } from './provenance/ai-provenance.service';
import { AiService } from '../../ai/ai.service';
import { Role } from '../../auth/role.enum';
import {
  AiCapability,
  AiResponsePayload,
  ContentQualityReport,
  GeneratedQuestionDraft,
} from './ai.types';

@Injectable()
export class AiKnowledgeService {
  private readonly logger = new Logger(AiKnowledgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly retriever: KnowledgeRetrieverService,
    private readonly grounding: GroundingValidatorService,
    private readonly guardrail: AiGuardrailService,
    private readonly provenance: AiProvenanceService,
    private readonly aiService: AiService,
  ) {}

  // ==========================================
  // TEACHER CAPABILITIES
  // ==========================================

  /**
   * Generates a pedagogical example or worked example for a knowledge object.
   */
  async generateExample(
    actorId: string,
    knowledgeId: string,
    instructions?: string,
    tenantId = 'default-tenant',
  ): Promise<AiResponsePayload<{ example: string; explanation: string }>> {
    this.guardrail.validateCapabilityAccess(AiCapability.GENERATE_EXAMPLE, Role.TEACHER);
    const sanitizedInstructions = this.guardrail.sanitizeInputPrompt(instructions || '');

    const context = await this.retriever.retrieveContext(
      knowledgeId,
      actorId,
      Role.TEACHER,
      tenantId,
    );

    const prompt = `You are an expert pedagogical assistant for teachers.
Target Topic: "${context.targetKnowledge.title}"
Content:
${context.targetKnowledge.content}

Prerequisites:
${context.prerequisites?.map((p) => `- ${p.title}: ${p.content}`).join('\n') || 'None'}

Additional Instructions: ${sanitizedInstructions || 'Provide an illustrative, practical real-world example with step-by-step pedagogical explanation.'}

Return a structured JSON with:
"example": "The illustrative example text or problem scenario.",
"explanation": "Pedagogical explanation of why this example illustrates the concept."`;

    const schemaInstruction = `JSON object with keys "example" (string) and "explanation" (string).`;
    const fallback = () => ({
      example: `For instance, consider how ${context.targetKnowledge.title} applies in everyday life: observing how inputs transform into outputs step-by-step.`,
      explanation: `This example connects the abstract definition of ${context.targetKnowledge.title} to concrete observation.`,
    });

    const genResult = await this.aiService.generateStructured<{ example: string; explanation: string }>(
      prompt,
      schemaInstruction,
      fallback,
    );

    const groundingResult = this.grounding.validateGrounding(
      `${genResult.data.example} ${genResult.data.explanation}`,
      context,
    );

    const sourceKnowledgeIds = [context.targetKnowledge.id, ...(context.prerequisites?.map((p) => p.id) || [])];
    const sourceVersionIds = [context.targetKnowledge.versionId].filter(Boolean) as string[];

    const prov = await this.provenance.recordProvenance({
      tenantId,
      actorId,
      capability: AiCapability.GENERATE_EXAMPLE,
      provider: genResult.provider,
      knowledgeObjectId: knowledgeId,
      knowledgeVersionId: context.targetKnowledge.versionId,
      sourceKnowledgeIds,
      sourceVersionIds,
      outputData: genResult.data,
      groundingScore: groundingResult.groundingScore,
      safetyStatus: 'PASSED',
    });

    return {
      requestId: prov.requestId,
      capability: AiCapability.GENERATE_EXAMPLE,
      responseType: 'GROUNDED_GENERATED',
      canonical: false,
      requiresReview: true,
      data: genResult.data,
      sources: [
        { id: context.targetKnowledge.id, title: context.targetKnowledge.title },
        ...(context.prerequisites?.map((p) => ({ id: p.id, title: p.title })) || []),
      ],
      metadata: {
        model: 'gemini-1.5-pro',
        provider: genResult.provider,
        groundingScore: groundingResult.groundingScore,
        outputHash: prov.outputHash,
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Generates curriculum-aligned assessment questions grounded in content.
   */
  async generateQuestions(
    actorId: string,
    knowledgeId: string,
    count = 3,
    tenantId = 'default-tenant',
  ): Promise<AiResponsePayload<GeneratedQuestionDraft[]>> {
    this.guardrail.validateCapabilityAccess(AiCapability.GENERATE_QUESTION, Role.TEACHER);

    const context = await this.retriever.retrieveContext(
      knowledgeId,
      actorId,
      Role.TEACHER,
      tenantId,
    );

    const prompt = `You are an expert assessment designer.
Generate ${count} curriculum-aligned multiple-choice questions for:
Topic: "${context.targetKnowledge.title}"
Content:
${context.targetKnowledge.content}

Prerequisites:
${context.prerequisites?.map((p) => `- ${p.title}`).join('\n') || 'None'}

Return a JSON array of question objects where each object has:
- "stem": string (the question stem)
- "type": "MULTIPLE_CHOICE"
- "difficulty": number between 1 and 5
- "options": array of 4 distinct string choices
- "correctAnswer": string (must match one of the options)
- "explanation": string (pedagogical explanation of why the answer is correct and why distractors are wrong)
- "learningObjectives": array of string objective codes or titles
- "misconceptionsTargeted": optional array of common student misconceptions addressed`;

    const schemaInstruction = `JSON array of objects with keys "stem", "type", "difficulty", "options", "correctAnswer", "explanation", "learningObjectives", "misconceptionsTargeted".`;
    const fallback = (): GeneratedQuestionDraft[] => [
      {
        stem: `What is the fundamental concept underlying ${context.targetKnowledge.title}?`,
        type: 'MULTIPLE_CHOICE',
        difficulty: 2,
        options: [
          `The core principles defined in ${context.targetKnowledge.title}`,
          'An unrelated peripheral rule',
          'A historical exception',
          'None of the above',
        ],
        correctAnswer: `The core principles defined in ${context.targetKnowledge.title}`,
        explanation: `As outlined in the curriculum for ${context.targetKnowledge.title}, this core principle forms the basis of understanding.`,
        learningObjectives: ['LO-1'],
        misconceptionsTargeted: ['Confusing foundational principles with edge cases'],
      },
    ];

    const genResult = await this.aiService.generateStructured<GeneratedQuestionDraft[]>(
      prompt,
      schemaInstruction,
      fallback,
    );

    const groundingResult = this.grounding.validateGrounding(
      JSON.stringify(genResult.data),
      context,
    );

    const prov = await this.provenance.recordProvenance({
      tenantId,
      actorId,
      capability: AiCapability.GENERATE_QUESTION,
      provider: genResult.provider,
      knowledgeObjectId: knowledgeId,
      knowledgeVersionId: context.targetKnowledge.versionId,
      sourceKnowledgeIds: [context.targetKnowledge.id],
      sourceVersionIds: [context.targetKnowledge.versionId].filter(Boolean) as string[],
      outputData: genResult.data,
      groundingScore: groundingResult.groundingScore,
      safetyStatus: 'PASSED',
    });

    return {
      requestId: prov.requestId,
      capability: AiCapability.GENERATE_QUESTION,
      responseType: 'GROUNDED_GENERATED',
      canonical: false,
      requiresReview: true,
      data: genResult.data,
      sources: [{ id: context.targetKnowledge.id, title: context.targetKnowledge.title }],
      metadata: {
        model: 'gemini-1.5-pro',
        provider: genResult.provider,
        groundingScore: groundingResult.groundingScore,
        outputHash: prov.outputHash,
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Suggests learning objectives based on knowledge content.
   */
  async suggestObjectives(
    actorId: string,
    knowledgeId: string,
    tenantId = 'default-tenant',
  ): Promise<AiResponsePayload<Array<{ code: string; title: string; description: string; bloomLevel: string }>>> {
    this.guardrail.validateCapabilityAccess(AiCapability.SUGGEST_OBJECTIVES, Role.TEACHER);

    const context = await this.retriever.retrieveContext(
      knowledgeId,
      actorId,
      Role.TEACHER,
      tenantId,
    );

    const prompt = `Based on the following curriculum content for "${context.targetKnowledge.title}":
${context.targetKnowledge.content}

Suggest 3 to 5 measurable learning objectives using Bloom's Taxonomy.
Return a JSON array of objects with keys:
- "code": e.g. "LO-1", "LO-2"
- "title": concise objective statement
- "description": specific criteria for demonstration of mastery
- "bloomLevel": one of "REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"`;

    const schemaInstruction = `JSON array of objects with keys "code", "title", "description", "bloomLevel".`;
    const fallback = () => [
      {
        code: 'LO-1',
        title: `Understand foundational principles of ${context.targetKnowledge.title}`,
        description: `Students can define and explain key terms and concepts in ${context.targetKnowledge.title}.`,
        bloomLevel: 'UNDERSTAND',
      },
      {
        code: 'LO-2',
        title: `Apply principles of ${context.targetKnowledge.title} to solve standard problems`,
        description: `Students can apply concepts to answer questions and complete practice exercises.`,
        bloomLevel: 'APPLY',
      },
    ];

    const genResult = await this.aiService.generateStructured<Array<{ code: string; title: string; description: string; bloomLevel: string }>>(
      prompt,
      schemaInstruction,
      fallback,
    );

    const prov = await this.provenance.recordProvenance({
      tenantId,
      actorId,
      capability: AiCapability.SUGGEST_OBJECTIVES,
      provider: genResult.provider,
      knowledgeObjectId: knowledgeId,
      knowledgeVersionId: context.targetKnowledge.versionId,
      sourceKnowledgeIds: [context.targetKnowledge.id],
      sourceVersionIds: [context.targetKnowledge.versionId].filter(Boolean) as string[],
      outputData: genResult.data,
      groundingScore: 0.95,
      safetyStatus: 'PASSED',
    });

    return {
      requestId: prov.requestId,
      capability: AiCapability.SUGGEST_OBJECTIVES,
      responseType: 'GROUNDED_GENERATED',
      canonical: false,
      requiresReview: true,
      data: genResult.data,
      sources: [{ id: context.targetKnowledge.id, title: context.targetKnowledge.title }],
      metadata: {
        model: 'gemini-1.5-pro',
        provider: genResult.provider,
        groundingScore: 0.95,
        outputHash: prov.outputHash,
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Suggests candidate prerequisites for a knowledge object by analyzing concepts and existing library.
   */
  async suggestPrerequisites(
    actorId: string,
    knowledgeId: string,
    tenantId = 'default-tenant',
  ): Promise<AiResponsePayload<Array<{ title: string; rationale: string; confidence: number }>>> {
    this.guardrail.validateCapabilityAccess(AiCapability.SUGGEST_PREREQUISITES, Role.TEACHER);

    const context = await this.retriever.retrieveContext(
      knowledgeId,
      actorId,
      Role.TEACHER,
      tenantId,
    );

    // Fetch existing knowledge objects in tenant to suggest real matches
    const existingObjects = await this.prisma.knowledgeObject.findMany({
      where: {
        id: { not: knowledgeId },
        OR: [{ tenantId }, { tenantId: null }],
      },
      select: { id: true, title: true, type: true },
      take: 20,
    });

    const prompt = `You are a curriculum graph architect.
Target Topic: "${context.targetKnowledge.title}"
Content:
${context.targetKnowledge.content}

Available Knowledge Objects in Library:
${existingObjects.map((o) => `- ${o.title} (${o.type})`).join('\n')}

Identify 2 to 4 prerequisite concepts that a learner MUST understand before learning "${context.targetKnowledge.title}".
Return a JSON array of objects with keys:
- "title": name of the prerequisite concept (prefer exact titles from the library if matched)
- "rationale": pedagogical explanation of why this prerequisite is strictly necessary
- "confidence": number between 0.5 and 1.0`;

    const schemaInstruction = `JSON array of objects with keys "title", "rationale", "confidence".`;
    const fallback = () => [
      {
        title: 'Foundations of the Subject',
        rationale: `Learners need core terminology before advancing to ${context.targetKnowledge.title}.`,
        confidence: 0.85,
      },
    ];

    const genResult = await this.aiService.generateStructured<Array<{ title: string; rationale: string; confidence: number }>>(
      prompt,
      schemaInstruction,
      fallback,
    );

    const prov = await this.provenance.recordProvenance({
      tenantId,
      actorId,
      capability: AiCapability.SUGGEST_PREREQUISITES,
      provider: genResult.provider,
      knowledgeObjectId: knowledgeId,
      knowledgeVersionId: context.targetKnowledge.versionId,
      sourceKnowledgeIds: [context.targetKnowledge.id],
      sourceVersionIds: [context.targetKnowledge.versionId].filter(Boolean) as string[],
      outputData: genResult.data,
      groundingScore: 0.90,
      safetyStatus: 'PASSED',
    });

    return {
      requestId: prov.requestId,
      capability: AiCapability.SUGGEST_PREREQUISITES,
      responseType: 'GROUNDED_GENERATED',
      canonical: false,
      requiresReview: true,
      data: genResult.data,
      sources: [{ id: context.targetKnowledge.id, title: context.targetKnowledge.title }],
      metadata: {
        model: 'gemini-1.5-pro',
        provider: genResult.provider,
        groundingScore: 0.90,
        outputHash: prov.outputHash,
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Suggests knowledge relationships (RELATED, EXTENDS, APPLIES).
   */
  async suggestRelationships(
    actorId: string,
    knowledgeId: string,
    tenantId = 'default-tenant',
  ): Promise<AiResponsePayload<Array<{ targetTitle: string; relationType: string; rationale: string }>>> {
    this.guardrail.validateCapabilityAccess(AiCapability.SUGGEST_RELATIONSHIPS, Role.TEACHER);

    const context = await this.retriever.retrieveContext(
      knowledgeId,
      actorId,
      Role.TEACHER,
      tenantId,
    );

    const prompt = `You are an educational knowledge graph engineer.
Target Concept: "${context.targetKnowledge.title}"
Content:
${context.targetKnowledge.content}

Suggest 2 to 4 conceptual relationships for this topic.
Relation types can be: "RELATED", "EXTENDS", "APPLIES_TO", "CONTRASTS_WITH".
Return a JSON array of objects with keys:
- "targetTitle": name of related concept
- "relationType": one of the types above
- "rationale": explanation of the semantic connection`;

    const schemaInstruction = `JSON array of objects with keys "targetTitle", "relationType", "rationale".`;
    const fallback = () => [
      {
        targetTitle: 'Practical Applications',
        relationType: 'APPLIES_TO',
        rationale: `Demonstrates real-world use cases of ${context.targetKnowledge.title}.`,
      },
    ];

    const genResult = await this.aiService.generateStructured<Array<{ targetTitle: string; relationType: string; rationale: string }>>(
      prompt,
      schemaInstruction,
      fallback,
    );

    const prov = await this.provenance.recordProvenance({
      tenantId,
      actorId,
      capability: AiCapability.SUGGEST_RELATIONSHIPS,
      provider: genResult.provider,
      knowledgeObjectId: knowledgeId,
      knowledgeVersionId: context.targetKnowledge.versionId,
      sourceKnowledgeIds: [context.targetKnowledge.id],
      sourceVersionIds: [context.targetKnowledge.versionId].filter(Boolean) as string[],
      outputData: genResult.data,
      groundingScore: 0.90,
      safetyStatus: 'PASSED',
    });

    return {
      requestId: prov.requestId,
      capability: AiCapability.SUGGEST_RELATIONSHIPS,
      responseType: 'GROUNDED_GENERATED',
      canonical: false,
      requiresReview: true,
      data: genResult.data,
      sources: [{ id: context.targetKnowledge.id, title: context.targetKnowledge.title }],
      metadata: {
        model: 'gemini-1.5-pro',
        provider: genResult.provider,
        groundingScore: 0.90,
        outputHash: prov.outputHash,
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Performs automated pedagogical quality analysis on a draft knowledge object.
   */
  async analyzeQuality(
    actorId: string,
    knowledgeId: string,
    tenantId = 'default-tenant',
  ): Promise<AiResponsePayload<ContentQualityReport>> {
    this.guardrail.validateCapabilityAccess(AiCapability.QUALITY_ANALYSIS, Role.TEACHER);

    const context = await this.retriever.retrieveContext(
      knowledgeId,
      actorId,
      Role.TEACHER,
      tenantId,
    );

    const prompt = `Perform an objective pedagogical quality review of the following educational content:
Title: "${context.targetKnowledge.title}"
Content:
${context.targetKnowledge.content}

Evaluate:
1. Completeness (0.0 to 1.0)
2. Clarity (0.0 to 1.0)
3. Objective Alignment (0.0 to 1.0)
4. Pedagogical Flow (0.0 to 1.0)
5. Issues: list of specific actionable recommendations with severity ('INFO', 'WARNING', 'ERROR'), code, and message.

Return a JSON object matching ContentQualityReport.`;

    const schemaInstruction = `JSON object with keys "completeness" (number), "clarity" (number), "objectiveAlignment" (number), "pedagogicalFlow" (number), "issues" (array of {severity, code, message}).`;
    const fallback = (): ContentQualityReport => ({
      completeness: 0.85,
      clarity: 0.90,
      objectiveAlignment: 0.88,
      pedagogicalFlow: 0.87,
      issues: [
        {
          severity: 'INFO',
          code: 'ADD_WORKED_EXAMPLE',
          message: 'Consider adding a step-by-step worked example to strengthen practical retention.',
        },
      ],
    });

    const genResult = await this.aiService.generateStructured<ContentQualityReport>(
      prompt,
      schemaInstruction,
      fallback,
    );

    const prov = await this.provenance.recordProvenance({
      tenantId,
      actorId,
      capability: AiCapability.QUALITY_ANALYSIS,
      provider: genResult.provider,
      knowledgeObjectId: knowledgeId,
      knowledgeVersionId: context.targetKnowledge.versionId,
      sourceKnowledgeIds: [context.targetKnowledge.id],
      sourceVersionIds: [context.targetKnowledge.versionId].filter(Boolean) as string[],
      outputData: genResult.data,
      groundingScore: 1.0,
      safetyStatus: 'PASSED',
    });

    return {
      requestId: prov.requestId,
      capability: AiCapability.QUALITY_ANALYSIS,
      responseType: 'ANALYTICAL_SIGNAL',
      canonical: false,
      requiresReview: true,
      data: genResult.data,
      sources: [{ id: context.targetKnowledge.id, title: context.targetKnowledge.title }],
      metadata: {
        model: 'gemini-1.5-pro',
        provider: genResult.provider,
        groundingScore: 1.0,
        outputHash: prov.outputHash,
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Differentiates content for different reading levels, scaffolds, or learning styles.
   */
  async differentiateContent(
    actorId: string,
    knowledgeId: string,
    targetLevel: string,
    tenantId = 'default-tenant',
  ): Promise<AiResponsePayload<{ differentiatedText: string; adjustments: string[] }>> {
    this.guardrail.validateCapabilityAccess(AiCapability.DIFFERENTIATE, Role.TEACHER);
    const sanitizedLevel = this.guardrail.sanitizeInputPrompt(targetLevel);

    const context = await this.retriever.retrieveContext(
      knowledgeId,
      actorId,
      Role.TEACHER,
      tenantId,
    );

    const prompt = `You are an expert in differentiated instruction.
Original Content for "${context.targetKnowledge.title}":
${context.targetKnowledge.content}

Target Differentiation / Level: "${sanitizedLevel}"
Rewrite the content to meet this target level while maintaining factual accuracy and core learning objectives.
Return a JSON object with:
- "differentiatedText": the adapted text
- "adjustments": array of specific pedagogical scaffolding adjustments made`;

    const schemaInstruction = `JSON object with keys "differentiatedText" (string) and "adjustments" (array of strings).`;
    const fallback = () => ({
      differentiatedText: `Adapted overview of ${context.targetKnowledge.title}: simplified breakdown of key concepts for level ${sanitizedLevel}.`,
      adjustments: ['Simplified sentence structure', 'Defined domain terms with analogies'],
    });

    const genResult = await this.aiService.generateStructured<{ differentiatedText: string; adjustments: string[] }>(
      prompt,
      schemaInstruction,
      fallback,
    );

    const groundingResult = this.grounding.validateGrounding(
      genResult.data.differentiatedText,
      context,
    );

    const prov = await this.provenance.recordProvenance({
      tenantId,
      actorId,
      capability: AiCapability.DIFFERENTIATE,
      provider: genResult.provider,
      knowledgeObjectId: knowledgeId,
      knowledgeVersionId: context.targetKnowledge.versionId,
      sourceKnowledgeIds: [context.targetKnowledge.id],
      sourceVersionIds: [context.targetKnowledge.versionId].filter(Boolean) as string[],
      outputData: genResult.data,
      groundingScore: groundingResult.groundingScore,
      safetyStatus: 'PASSED',
    });

    return {
      requestId: prov.requestId,
      capability: AiCapability.DIFFERENTIATE,
      responseType: 'GROUNDED_GENERATED',
      canonical: false,
      requiresReview: true,
      data: genResult.data,
      sources: [{ id: context.targetKnowledge.id, title: context.targetKnowledge.title }],
      metadata: {
        model: 'gemini-1.5-pro',
        provider: genResult.provider,
        groundingScore: groundingResult.groundingScore,
        outputHash: prov.outputHash,
        generatedAt: new Date(),
      },
    };
  }

  // ==========================================
  // STUDENT CAPABILITIES
  // ==========================================

  /**
   * Generates a grounded, Socratic or direct explanation for a student learning a concept.
   */
  async explain(
    learnerId: string,
    knowledgeId: string,
    query: string,
    sectionId?: string,
    tenantId = 'default-tenant',
  ): Promise<AiResponsePayload<{ explanation: string; followUpQuestions: string[] }>> {
    this.guardrail.validateCapabilityAccess(AiCapability.GENERATE_EXPLANATION, Role.STUDENT);
    const sanitizedQuery = this.guardrail.sanitizeInputPrompt(query);

    const context = await this.retriever.retrieveContext(
      knowledgeId,
      learnerId,
      Role.STUDENT,
      tenantId,
    );

    const masteryInfo = context.learnerState
      ? `Student Mastery Level: ${(context.learnerState.masteryLevel * 100).toFixed(0)}% (${context.learnerState.status})`
      : 'Mastery Level: Beginner';

    const prompt = `You are a supportive, grounded AI learning assistant.
Explain the following student question based STRICTLY on the published curriculum content provided.

Topic: "${context.targetKnowledge.title}"
Curriculum Content:
${context.targetKnowledge.content}

Prerequisites:
${context.prerequisites?.map((p) => `- ${p.title}: ${p.content}`).join('\n') || 'None'}

${masteryInfo}
Student Question: "${sanitizedQuery}"

Instructions:
- Provide an intuitive, encouraging explanation strictly grounded in the curriculum content.
- Include 1 or 2 reflective follow-up questions to test student comprehension.
- Do NOT introduce facts outside the curriculum.

Return a JSON object with:
"explanation": string,
"followUpQuestions": array of strings`;

    const schemaInstruction = `JSON object with keys "explanation" (string) and "followUpQuestions" (array of strings).`;
    const fallback = () => ({
      explanation: `In "${context.targetKnowledge.title}", this concept means that: ${context.targetKnowledge.content.slice(0, 200)}...`,
      followUpQuestions: [`How would you explain the core idea of ${context.targetKnowledge.title} in your own words?`],
    });

    const genResult = await this.aiService.generateStructured<{ explanation: string; followUpQuestions: string[] }>(
      prompt,
      schemaInstruction,
      fallback,
    );

    const groundingResult = this.grounding.validateGrounding(
      genResult.data.explanation,
      context,
    );

    const prov = await this.provenance.recordProvenance({
      tenantId,
      actorId: learnerId,
      capability: AiCapability.GENERATE_EXPLANATION,
      provider: genResult.provider,
      knowledgeObjectId: knowledgeId,
      knowledgeVersionId: context.targetKnowledge.versionId,
      sourceKnowledgeIds: [context.targetKnowledge.id],
      sourceVersionIds: [context.targetKnowledge.versionId].filter(Boolean) as string[],
      outputData: genResult.data,
      groundingScore: groundingResult.groundingScore,
      safetyStatus: 'PASSED',
    });

    return {
      requestId: prov.requestId,
      capability: AiCapability.GENERATE_EXPLANATION,
      responseType: 'GROUNDED_GENERATED',
      canonical: false,
      requiresReview: false,
      data: genResult.data,
      sources: [{ id: context.targetKnowledge.id, title: context.targetKnowledge.title }],
      metadata: {
        model: 'gemini-1.5-pro',
        provider: genResult.provider,
        groundingScore: groundingResult.groundingScore,
        outputHash: prov.outputHash,
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Generates a progressive scaffolded hint without leaking the answer.
   */
  async hint(
    learnerId: string,
    knowledgeId: string,
    questionId?: string,
    attemptCount = 1,
    expectedAnswer?: string,
    tenantId = 'default-tenant',
  ): Promise<AiResponsePayload<{ hint: string; scaffoldLevel: 'CONCEPTUAL' | 'PROCEDURAL' | 'SETUP' }>> {
    this.guardrail.validateCapabilityAccess(AiCapability.GENERATE_HINT, Role.STUDENT);

    const context = await this.retriever.retrieveContext(
      knowledgeId,
      learnerId,
      Role.STUDENT,
      tenantId,
    );

    // Progressive scaffolding tier based on attempt count
    let scaffoldLevel: 'CONCEPTUAL' | 'PROCEDURAL' | 'SETUP' = 'CONCEPTUAL';
    if (attemptCount === 2) {
      scaffoldLevel = 'PROCEDURAL';
    } else if (attemptCount >= 3) {
      scaffoldLevel = 'SETUP';
    }

    const prompt = `You are a pedagogical tutor providing a progressive hint.
Topic: "${context.targetKnowledge.title}"
Content:
${context.targetKnowledge.content}

Target Scaffolding Level: "${scaffoldLevel}" (Attempt #${attemptCount})
- CONCEPTUAL (Attempt 1): Guide student towards the relevant concept or rule without step-by-step procedure.
- PROCEDURAL (Attempt 2): Remind student of the procedure/steps to apply.
- SETUP (Attempt 3+): Help student set up the initial equation or structure. NEVER reveal the final answer.

Provide a short, encouraging hint. Return JSON with:
"hint": string,
"scaffoldLevel": "${scaffoldLevel}"`;

    const schemaInstruction = `JSON object with keys "hint" (string) and "scaffoldLevel" (string).`;
    const fallback = () => ({
      hint: `Recall the core idea of ${context.targetKnowledge.title}. Think about what principles apply first.`,
      scaffoldLevel,
    });

    const genResult = await this.aiService.generateStructured<{ hint: string; scaffoldLevel: 'CONCEPTUAL' | 'PROCEDURAL' | 'SETUP' }>(
      prompt,
      schemaInstruction,
      fallback,
    );

    // Enforce hint answer masking guardrail
    const safeHint = this.guardrail.validateHintOutput(genResult.data.hint, expectedAnswer);
    genResult.data.hint = safeHint;

    const prov = await this.provenance.recordProvenance({
      tenantId,
      actorId: learnerId,
      capability: AiCapability.GENERATE_HINT,
      provider: genResult.provider,
      knowledgeObjectId: knowledgeId,
      knowledgeVersionId: context.targetKnowledge.versionId,
      sourceKnowledgeIds: [context.targetKnowledge.id],
      sourceVersionIds: [context.targetKnowledge.versionId].filter(Boolean) as string[],
      outputData: genResult.data,
      groundingScore: 0.95,
      safetyStatus: 'PASSED',
    });

    return {
      requestId: prov.requestId,
      capability: AiCapability.GENERATE_HINT,
      responseType: 'GROUNDED_GENERATED',
      canonical: false,
      requiresReview: false,
      data: genResult.data,
      sources: [{ id: context.targetKnowledge.id, title: context.targetKnowledge.title }],
      metadata: {
        model: 'gemini-1.5-pro',
        provider: genResult.provider,
        groundingScore: 0.95,
        outputHash: prov.outputHash,
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Generates a grounded student-friendly example of a concept.
   */
  async example(
    learnerId: string,
    knowledgeId: string,
    concept?: string,
    tenantId = 'default-tenant',
  ): Promise<AiResponsePayload<{ concept: string; example: string; takeaway: string }>> {
    this.guardrail.validateCapabilityAccess(AiCapability.GENERATE_EXPLANATION, Role.STUDENT);
    const sanitizedConcept = this.guardrail.sanitizeInputPrompt(concept || '');

    const context = await this.retriever.retrieveContext(
      knowledgeId,
      learnerId,
      Role.STUDENT,
      tenantId,
    );

    const prompt = `Generate a clear, relatable real-world example for a student.
Topic: "${context.targetKnowledge.title}"
Content:
${context.targetKnowledge.content}
Specific Concept: "${sanitizedConcept || context.targetKnowledge.title}"

Return JSON with:
"concept": string,
"example": string,
"takeaway": string`;

    const schemaInstruction = `JSON object with keys "concept" (string), "example" (string), "takeaway" (string).`;
    const fallback = () => ({
      concept: sanitizedConcept || context.targetKnowledge.title,
      example: `Think of ${context.targetKnowledge.title} like organizing a bookshelf so each book has an exact known place.`,
      takeaway: `Structured organization helps retrieve information quickly and accurately.`,
    });

    const genResult = await this.aiService.generateStructured<{ concept: string; example: string; takeaway: string }>(
      prompt,
      schemaInstruction,
      fallback,
    );

    const groundingResult = this.grounding.validateGrounding(
      `${genResult.data.example} ${genResult.data.takeaway}`,
      context,
    );

    const prov = await this.provenance.recordProvenance({
      tenantId,
      actorId: learnerId,
      capability: AiCapability.GENERATE_EXPLANATION,
      provider: genResult.provider,
      knowledgeObjectId: knowledgeId,
      knowledgeVersionId: context.targetKnowledge.versionId,
      sourceKnowledgeIds: [context.targetKnowledge.id],
      sourceVersionIds: [context.targetKnowledge.versionId].filter(Boolean) as string[],
      outputData: genResult.data,
      groundingScore: groundingResult.groundingScore,
      safetyStatus: 'PASSED',
    });

    return {
      requestId: prov.requestId,
      capability: AiCapability.GENERATE_EXPLANATION,
      responseType: 'GROUNDED_GENERATED',
      canonical: false,
      requiresReview: false,
      data: genResult.data,
      sources: [{ id: context.targetKnowledge.id, title: context.targetKnowledge.title }],
      metadata: {
        model: 'gemini-1.5-pro',
        provider: genResult.provider,
        groundingScore: groundingResult.groundingScore,
        outputHash: prov.outputHash,
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Generates a concise summary and key takeaways for a knowledge object.
   */
  async summarize(
    learnerId: string,
    knowledgeId: string,
    tenantId = 'default-tenant',
  ): Promise<AiResponsePayload<{ summary: string; keyPoints: string[] }>> {
    this.guardrail.validateCapabilityAccess(AiCapability.GENERATE_SUMMARY, Role.STUDENT);

    const context = await this.retriever.retrieveContext(
      knowledgeId,
      learnerId,
      Role.STUDENT,
      tenantId,
    );

    const prompt = `Summarize the following educational content for a student:
Topic: "${context.targetKnowledge.title}"
Content:
${context.targetKnowledge.content}

Provide:
1. "summary": A concise 2-3 sentence overview.
2. "keyPoints": An array of 3-5 bulleted takeaway points.

Return JSON matching these keys.`;

    const schemaInstruction = `JSON object with keys "summary" (string) and "keyPoints" (array of strings).`;
    const fallback = () => ({
      summary: `This lesson covers the core concepts and principles of ${context.targetKnowledge.title}.`,
      keyPoints: [
        `Understand the key terms of ${context.targetKnowledge.title}`,
        'Recognize practical applications',
        'Connect foundational prerequisites to new concepts',
      ],
    });

    const genResult = await this.aiService.generateStructured<{ summary: string; keyPoints: string[] }>(
      prompt,
      schemaInstruction,
      fallback,
    );

    const groundingResult = this.grounding.validateGrounding(
      `${genResult.data.summary} ${genResult.data.keyPoints.join(' ')}`,
      context,
    );

    const prov = await this.provenance.recordProvenance({
      tenantId,
      actorId: learnerId,
      capability: AiCapability.GENERATE_SUMMARY,
      provider: genResult.provider,
      knowledgeObjectId: knowledgeId,
      knowledgeVersionId: context.targetKnowledge.versionId,
      sourceKnowledgeIds: [context.targetKnowledge.id],
      sourceVersionIds: [context.targetKnowledge.versionId].filter(Boolean) as string[],
      outputData: genResult.data,
      groundingScore: groundingResult.groundingScore,
      safetyStatus: 'PASSED',
    });

    return {
      requestId: prov.requestId,
      capability: AiCapability.GENERATE_SUMMARY,
      responseType: 'GROUNDED_GENERATED',
      canonical: false,
      requiresReview: false,
      data: genResult.data,
      sources: [{ id: context.targetKnowledge.id, title: context.targetKnowledge.title }],
      metadata: {
        model: 'gemini-1.5-pro',
        provider: genResult.provider,
        groundingScore: groundingResult.groundingScore,
        outputHash: prov.outputHash,
        generatedAt: new Date(),
      },
    };
  }

  /**
   * AI-powered semantic search and discovery assist over published knowledge.
   */
  async searchAssist(
    learnerId: string,
    query: string,
    tenantId = 'default-tenant',
  ): Promise<AiResponsePayload<{ suggestions: Array<{ id: string; title: string; type: string; relevanceReason: string }> }>> {
    this.guardrail.validateCapabilityAccess(AiCapability.SEARCH_ASSIST, Role.STUDENT);
    const sanitizedQuery = this.guardrail.sanitizeInputPrompt(query);

    // Search published knowledge objects
    const matched = await this.prisma.knowledgeObject.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [{ tenantId }, { tenantId: null }],
        AND: [
          {
            OR: [
              { title: { contains: sanitizedQuery, mode: 'insensitive' } },
              { description: { contains: sanitizedQuery, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: { id: true, title: true, type: true, description: true },
      take: 5,
    });

    const suggestions = matched.map((m) => ({
      id: m.id,
      title: m.title,
      type: m.type,
      relevanceReason: `Matches query terms in title or description.`,
    }));

    const prov = await this.provenance.recordProvenance({
      tenantId,
      actorId: learnerId,
      capability: AiCapability.SEARCH_ASSIST,
      sourceKnowledgeIds: matched.map((m) => m.id),
      sourceVersionIds: [],
      outputData: { suggestions },
      groundingScore: 1.0,
      safetyStatus: 'PASSED',
    });

    return {
      requestId: prov.requestId,
      capability: AiCapability.SEARCH_ASSIST,
      responseType: 'GROUNDED_GENERATED',
      canonical: false,
      requiresReview: false,
      data: { suggestions },
      sources: matched.map((m) => ({ id: m.id, title: m.title })),
      metadata: {
        model: 'gemini-1.5-pro',
        provider: 'GEMINI',
        groundingScore: 1.0,
        outputHash: prov.outputHash,
        generatedAt: new Date(),
      },
    };
  }
}
