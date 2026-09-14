import { Injectable, BadRequestException } from '@nestjs/common';
import { AiPurpose } from '../interfaces/ai-gateway.interface';

export class AiOutputValidationException extends BadRequestException {
  constructor(message: string, public readonly validationErrors?: string[]) {
    super(`AiOutputValidationException: ${message}`);
  }
}

export interface TutorResponse {
  explanation: string;
  hint?: string;
  misconception?: string;
  nextStep: 'PRACTICE' | 'RETRY' | 'EXTEND' | 'TEACHER_REVIEW';
}

export interface AssessmentFeedback {
  scoreConfidence: number;
  misconceptionIdentified?: string;
  remediationStep: string;
  socraticQuestion?: string;
}

export interface TeacherSummary {
  studentSummary: string;
  strengthAreas: string[];
  gapAreas: string[];
  suggestedInterventions: string[];
  confidenceScore: number;
}

export interface ParentSummary {
  plainLanguageSummary: string;
  celebrateProgress: string;
  suggestedHomeSupport: string;
}

export interface ContentDraft {
  title: string;
  questions: Array<{
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }>;
}

export interface SafetyClassification {
  riskCategory: string;
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  immediateEscalationRequired: boolean;
  reasoning: string;
}

@Injectable()
export class StructuredOutputService {
  /**
   * Cleans raw model text by stripping markdown code blocks and excess whitespace.
   */
  cleanJsonText(raw: string): string {
    if (!raw || typeof raw !== 'string') return '{}';
    return raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
  }

  /**
   * Safely parses JSON text into an object, throwing AiOutputValidationException if malformed.
   */
  parseJson<T = any>(raw: string): T {
    const cleaned = this.cleanJsonText(raw);
    try {
      return JSON.parse(cleaned) as T;
    } catch (err) {
      throw new AiOutputValidationException(`Malformed JSON response from model: ${err.message}`);
    }
  }

  /**
   * Validates parsed JSON against the purpose-specific schema.
   */
  validateByPurpose<T = unknown>(purpose: AiPurpose, parsed: any): T {
    if (!parsed || typeof parsed !== 'object') {
      throw new AiOutputValidationException('Model output must be a valid JSON object.');
    }

    switch (purpose) {
      case 'TUTOR':
        return this.validateTutorResponse(parsed) as unknown as T;
      case 'FEEDBACK':
      case 'ASSESSMENT':
        return this.validateAssessmentFeedback(parsed) as unknown as T;
      case 'TEACHER_ASSIST':
        return this.validateTeacherSummary(parsed) as unknown as T;
      case 'PARENT_SUMMARY':
        return this.validateParentSummary(parsed) as unknown as T;
      case 'CONTENT':
        return this.validateContentDraft(parsed) as unknown as T;
      case 'SAFETY_SUPPORT':
        return this.validateSafetyClassification(parsed) as unknown as T;
      default:
        return parsed as T;
    }
  }

  validateTutorResponse(data: any): TutorResponse {
    const errors: string[] = [];
    if (!data.explanation || typeof data.explanation !== 'string' || data.explanation.trim().length === 0) {
      errors.push('explanation is required and must be a non-empty string.');
    }

    const validNextSteps = ['PRACTICE', 'RETRY', 'EXTEND', 'TEACHER_REVIEW'];
    const nextStep = data.nextStep && validNextSteps.includes(data.nextStep) ? data.nextStep : 'PRACTICE';

    if (errors.length > 0) {
      throw new AiOutputValidationException('Tutor response failed schema validation.', errors);
    }

    return {
      explanation: String(data.explanation).trim(),
      hint: data.hint ? String(data.hint).trim() : undefined,
      misconception: data.misconception ? String(data.misconception).trim() : undefined,
      nextStep,
    };
  }

  validateAssessmentFeedback(data: any): AssessmentFeedback {
    const errors: string[] = [];
    const confidence = typeof data.scoreConfidence === 'number'
      ? Math.max(0, Math.min(1, data.scoreConfidence))
      : 0.8;

    if (!data.remediationStep || typeof data.remediationStep !== 'string') {
      errors.push('remediationStep is required.');
    }

    if (errors.length > 0) {
      throw new AiOutputValidationException('Assessment feedback failed schema validation.', errors);
    }

    return {
      scoreConfidence: confidence,
      misconceptionIdentified: data.misconceptionIdentified ? String(data.misconceptionIdentified).trim() : undefined,
      remediationStep: String(data.remediationStep).trim(),
      socraticQuestion: data.socraticQuestion ? String(data.socraticQuestion).trim() : undefined,
    };
  }

  validateTeacherSummary(data: any): TeacherSummary {
    const errors: string[] = [];
    if (!data.studentSummary || typeof data.studentSummary !== 'string') {
      errors.push('studentSummary is required.');
    }

    if (errors.length > 0) {
      throw new AiOutputValidationException('Teacher summary failed schema validation.', errors);
    }

    return {
      studentSummary: String(data.studentSummary).trim(),
      strengthAreas: Array.isArray(data.strengthAreas) ? data.strengthAreas.map(String) : [],
      gapAreas: Array.isArray(data.gapAreas) ? data.gapAreas.map(String) : [],
      suggestedInterventions: Array.isArray(data.suggestedInterventions) ? data.suggestedInterventions.map(String) : [],
      confidenceScore: typeof data.confidenceScore === 'number' ? Math.max(0, Math.min(1, data.confidenceScore)) : 0.85,
    };
  }

  validateParentSummary(data: any): ParentSummary {
    const errors: string[] = [];
    if (!data.plainLanguageSummary || typeof data.plainLanguageSummary !== 'string') {
      errors.push('plainLanguageSummary is required.');
    }

    if (errors.length > 0) {
      throw new AiOutputValidationException('Parent summary failed schema validation.', errors);
    }

    return {
      plainLanguageSummary: String(data.plainLanguageSummary).trim(),
      celebrateProgress: data.celebrateProgress ? String(data.celebrateProgress).trim() : 'Continues consistent practice.',
      suggestedHomeSupport: data.suggestedHomeSupport ? String(data.suggestedHomeSupport).trim() : 'Encourage regular short study sessions.',
    };
  }

  validateContentDraft(data: any): ContentDraft {
    const errors: string[] = [];
    if (!data.title || typeof data.title !== 'string') {
      errors.push('title is required.');
    }
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      errors.push('questions array is required and must have at least 1 question.');
    } else {
      data.questions.forEach((q: any, idx: number) => {
        if (!q.question || typeof q.question !== 'string') {
          errors.push(`Question at index ${idx} is missing valid question content.`);
        }
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          errors.push(`Question at index ${idx} must have exactly 4 options.`);
        }
        if (!q.answer || !q.options?.includes(q.answer)) {
          errors.push(`Question at index ${idx} answer must match one of the 4 options.`);
        }
      });
    }

    if (errors.length > 0) {
      throw new AiOutputValidationException('Content draft failed schema validation.', errors);
    }

    return {
      title: String(data.title).trim(),
      questions: data.questions.map((q: any) => ({
        question: String(q.question).trim(),
        options: q.options.map(String),
        answer: String(q.answer).trim(),
        explanation: String(q.explanation || '').trim(),
      })),
    };
  }

  validateSafetyClassification(data: any): SafetyClassification {
    const validSeverities = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const severity = validSeverities.includes(data.severity) ? data.severity : 'LOW';

    return {
      riskCategory: String(data.riskCategory || 'GENERAL').trim(),
      severity,
      immediateEscalationRequired: Boolean(data.immediateEscalationRequired || severity === 'HIGH' || severity === 'CRITICAL'),
      reasoning: String(data.reasoning || 'Automated safety classification.').trim(),
    };
  }
}
