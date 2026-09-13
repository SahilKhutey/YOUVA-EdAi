import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

export interface OperationalLogContext {
  requestId?: string;
  userId?: string;
  route?: string;
  statusCode?: number;
  latencyMs?: number;
  [key: string]: unknown;
}

export interface LearningTelemetryContext {
  studentId: string;
  activityId?: string;
  conceptId?: string;
  evidenceId?: string;
  recommendationId?: string;
  modelVersion?: string;
  teacherOverride?: boolean;
}

@Injectable()
export class StructuredLoggerService implements NestLoggerService {
  private formatLog(level: string, message: string, context?: unknown) {
    return JSON.stringify({
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  log(message: string, context?: OperationalLogContext | unknown) {
    console.log(this.formatLog('INFO', message, context));
  }

  error(message: string, trace?: string, context?: OperationalLogContext | unknown) {
    console.error(this.formatLog('ERROR', message, { trace, context }));
  }

  warn(message: string, context?: OperationalLogContext | unknown) {
    console.warn(this.formatLog('WARN', message, context));
  }

  debug(message: string, context?: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatLog('DEBUG', message, context));
    }
  }

  /**
   * PII-conscious learning telemetry logger.
   * Strips raw student inputs, answers, and personally identifiable info.
   */
  logLearningTelemetry(event: string, telemetry: LearningTelemetryContext) {
    console.log(
      this.formatLog('LEARNING_TELEMETRY', event, {
        studentId: telemetry.studentId,
        activityId: telemetry.activityId,
        conceptId: telemetry.conceptId,
        evidenceId: telemetry.evidenceId,
        recommendationId: telemetry.recommendationId,
        modelVersion: telemetry.modelVersion,
        teacherOverride: telemetry.teacherOverride,
      }),
    );
  }

  /**
   * Structured Learning Transaction Logger (N2.18):
   * Emits audit logs with correlation chain while strictly preventing leakage
   * of passwords, JWT secrets, API keys, or raw sensitive learner responses.
   */
  logLearningTransaction(data: {
    timestamp?: string;
    requestId?: string;
    tenantId?: string;
    userId: string;
    sessionId: string;
    operation: string;
    durationMs: number;
    status: 'SUCCESS' | 'FAILURE' | 'IDEMPOTENT_HIT';
    errorCode?: string;
    attemptId?: string;
    correlationChain?: Record<string, string>;
  }) {
    console.log(
      this.formatLog('LEARNING_TRANSACTION', `Learning transaction: ${data.operation}`, {
        timestamp: data.timestamp || new Date().toISOString(),
        requestId: data.requestId || 'req-unassigned',
        tenantId: data.tenantId || 'tenant-default',
        userId: data.userId,
        sessionId: data.sessionId,
        operation: data.operation,
        durationMs: data.durationMs,
        status: data.status,
        errorCode: data.errorCode,
        attemptId: data.attemptId,
        correlationChain: data.correlationChain,
      }),
    );
  }
}
