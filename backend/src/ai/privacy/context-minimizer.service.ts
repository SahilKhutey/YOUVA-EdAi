import { Injectable } from '@nestjs/common';
import {
  TutorContext,
  AssessmentFeedbackContext,
  TeacherSummaryContext,
  ParentSummaryContext,
  ContentDraftContext,
} from '../interfaces/ai-context.interface';

@Injectable()
export class ContextMinimizerService {
  private readonly emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private readonly phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  private readonly idRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;

  /**
   * Sanitizes arbitrary text by redacting PII and sensitive identifiers.
   */
  sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(this.emailRegex, '[REDACTED_EMAIL]')
      .replace(this.phoneRegex, '[REDACTED_PHONE]')
      .replace(this.idRegex, '[REDACTED_ID]');
  }

  /**
   * Sanitizes object by removing blacklisted keys and redacting string values.
   */
  sanitizeObject<T>(input: T): T {
    if (!input || typeof input !== 'object') {
      if (typeof input === 'string') {
        return this.sanitizeText(input) as unknown as T;
      }
      return input;
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitizeObject(item)) as unknown as T;
    }

    const blacklistedKeys = new Set([
      'email',
      'useremail',
      'parentemail',
      'phone',
      'phonenumber',
      'address',
      'password',
      'hash',
      'salt',
      'token',
      'jwt',
      'secret',
      'bearer',
      'aadhaar',
      'ssn',
      'pan',
    ]);

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      const lowerKey = key.toLowerCase();
      if (blacklistedKeys.has(lowerKey)) {
        continue; // strip completely
      }
      result[key] = this.sanitizeObject(value);
    }
    return result as T;
  }

  /**
   * Minimizes tutor context to essential pedagogical attributes only.
   */
  minimizeTutorContext(raw: any): TutorContext {
    const ageBand = raw.learnerAgeBand || '13-14';
    const subject = this.sanitizeText(raw.subject || 'General');
    const concept = this.sanitizeText(raw.concept || 'General');
    const mastery = typeof raw.masteryLevel === 'number'
      ? Math.max(0, Math.min(1, Number(raw.masteryLevel.toFixed(2))))
      : 0.5;

    const recentErrors = Array.isArray(raw.recentErrors)
      ? raw.recentErrors.slice(0, 3).map((e: any) => this.sanitizeText(String(e)))
      : [];

    const currentActivity = this.sanitizeText(raw.currentActivity || 'PRACTICE');
    const userQuery = this.sanitizeText(raw.userQuery || raw.query || raw.message || '');

    const history = Array.isArray(raw.history)
      ? raw.history.slice(-6).map((h: any) => ({
          role: h.role === 'student' || h.role === 'user' ? ('student' as const) : ('tutor' as const),
          message: this.sanitizeText(h.message || h.content || ''),
        }))
      : [];

    return {
      learnerAgeBand: ageBand,
      subject,
      concept,
      masteryLevel: mastery,
      recentErrors,
      currentActivity,
      userQuery,
      history,
    };
  }

  /**
   * Minimizes assessment feedback context.
   */
  minimizeAssessmentContext(raw: any): AssessmentFeedbackContext {
    return {
      subject: this.sanitizeText(raw.subject || 'General'),
      concept: this.sanitizeText(raw.concept || 'General'),
      learnerAgeBand: raw.learnerAgeBand || '13-14',
      questionContent: this.sanitizeText(raw.questionContent || raw.question || ''),
      studentAnswer: this.sanitizeText(raw.studentAnswer || raw.answer || ''),
      expectedAnswer: raw.expectedAnswer ? this.sanitizeText(raw.expectedAnswer) : undefined,
      attemptCount: typeof raw.attemptCount === 'number' ? raw.attemptCount : 1,
    };
  }

  /**
   * Minimizes teacher summary context.
   */
  minimizeTeacherContext(raw: any): TeacherSummaryContext {
    return {
      learnerAgeBand: raw.learnerAgeBand || '13-14',
      subject: this.sanitizeText(raw.subject || 'General'),
      topicMasteries: Array.isArray(raw.topicMasteries)
        ? raw.topicMasteries.slice(0, 10).map((t: any) => ({
            topicId: t.topicId || 'anon-topic',
            topicName: this.sanitizeText(t.topicName || 'Topic'),
            masteryScore: Number((t.masteryScore || 0).toFixed(2)),
          }))
        : [],
      recentInterventions: Array.isArray(raw.recentInterventions)
        ? raw.recentInterventions.slice(0, 5).map((i: any) => ({
            type: this.sanitizeText(i.type || 'INTERVENE'),
            status: i.status || 'PENDING',
            reason: i.reason ? this.sanitizeText(i.reason) : undefined,
          }))
        : [],
      riskFactors: Array.isArray(raw.riskFactors)
        ? raw.riskFactors.map((r: any) => this.sanitizeText(String(r)))
        : [],
    };
  }

  /**
   * Minimizes parent summary context.
   */
  minimizeParentContext(raw: any): ParentSummaryContext {
    return {
      learnerAgeBand: raw.learnerAgeBand || '13-14',
      subject: this.sanitizeText(raw.subject || 'General'),
      currentStreakDays: typeof raw.currentStreakDays === 'number' ? raw.currentStreakDays : 0,
      completedTopicsCount: typeof raw.completedTopicsCount === 'number' ? raw.completedTopicsCount : 0,
      masteryDeltaSummary: raw.masteryDeltaSummary ? this.sanitizeText(raw.masteryDeltaSummary) : undefined,
    };
  }

  /**
   * Minimizes content draft context.
   */
  minimizeContentContext(raw: any): ContentDraftContext {
    return {
      subject: this.sanitizeText(raw.subject || 'General'),
      topic: this.sanitizeText(raw.topic || 'General Topic'),
      gradeLevel: this.sanitizeText(raw.gradeLevel || 'Grade 8'),
      targetBloomLevel: raw.targetBloomLevel || 'APPLICATION',
      questionCount: typeof raw.questionCount === 'number' ? Math.min(10, Math.max(1, raw.questionCount)) : 5,
    };
  }
}
