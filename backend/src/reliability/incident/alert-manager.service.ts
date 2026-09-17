import { Injectable, Logger } from '@nestjs/common';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface AlertTrigger {
  ruleId: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AlertManagerService {
  private readonly logger = new Logger(AlertManagerService.name);
  private readonly activeAlerts = new Map<string, AlertTrigger>();
  private readonly suppressionWindows = new Map<string, number>(); // ruleId -> timestamp

  private readonly occurrenceCounts = new Map<string, number>();

  // Default suppression window: 5 minutes (300,000 ms)
  private readonly defaultSuppressionMs = 300000;

  /**
   * Fires an alert if not currently within its suppression window.
   * Supports both object and positional arguments.
   */
  triggerAlert(
    inputOrRuleId:
      | string
      | {
          ruleId: string;
          severity: AlertSeverity;
          title?: string;
          message?: string;
          description?: string;
          source?: string;
          metadata?: Record<string, unknown>;
        },
    severityArg?: AlertSeverity,
    titleArg?: string,
    descriptionArg?: string,
    metadataArg?: Record<string, unknown>,
    suppressionMsArg?: number,
  ): any {
    const isObject = typeof inputOrRuleId === 'object';
    const ruleId = isObject ? inputOrRuleId.ruleId : inputOrRuleId;
    const severity = isObject ? inputOrRuleId.severity : (severityArg || 'MEDIUM');
    const title = isObject ? (inputOrRuleId.title || inputOrRuleId.ruleId) : (titleArg || ruleId);
    const description = isObject
      ? (inputOrRuleId.description || inputOrRuleId.message || '')
      : (descriptionArg || '');
    const metadata = isObject ? inputOrRuleId.metadata : metadataArg;
    const suppressionMs = suppressionMsArg ?? this.defaultSuppressionMs;

    const now = Date.now();
    const lastTriggered = this.suppressionWindows.get(ruleId);
    const occurrences = (this.occurrenceCounts.get(ruleId) || 0) + 1;
    this.occurrenceCounts.set(ruleId, occurrences);

    if (lastTriggered && now - lastTriggered < suppressionMs) {
      this.logger.debug(
        `Alert [${ruleId}] suppressed to prevent storm. Window remaining: ${Math.round(
          (suppressionMs - (now - lastTriggered)) / 1000,
        )}s`,
      );
      if (isObject) {
        return {
          id: `alert-${ruleId}`,
          ruleId,
          severity,
          occurrences,
          resolved: false,
          suppressed: true,
        };
      }
      return false;
    }

    const alert: AlertTrigger = {
      ruleId,
      severity,
      title,
      description,
      timestamp: new Date(),
      metadata,
    };

    this.activeAlerts.set(ruleId, alert);
    this.suppressionWindows.set(ruleId, now);

    if (severity === 'CRITICAL' || severity === 'HIGH') {
      this.logger.error(
        `🔔 [ALERT ${severity}] ${title} - ${description} | Metadata: ${JSON.stringify(
          metadata || {},
        )}`,
      );
    } else {
      this.logger.warn(`🔔 [ALERT ${severity}] ${title} - ${description}`);
    }

    if (isObject) {
      return {
        id: `alert-${ruleId}`,
        ruleId,
        severity,
        occurrences,
        resolved: false,
        suppressed: false,
      };
    }
    return true;
  }

  /**
   * Resolves an active alert and clears suppression.
   */
  resolveAlert(ruleIdOrAlertId: string, note?: string): any {
    const ruleId = ruleIdOrAlertId.startsWith('alert-')
      ? ruleIdOrAlertId.replace('alert-', '')
      : ruleIdOrAlertId;

    const removed = this.activeAlerts.delete(ruleId);
    this.suppressionWindows.delete(ruleId);
    this.occurrenceCounts.delete(ruleId);

    if (removed) {
      this.logger.log(`Alert [${ruleId}] resolved.${note ? ` Note: ${note}` : ''}`);
    }

    return { id: ruleIdOrAlertId, resolved: true };
  }

  /**
   * Returns all active alerts.
   */
  getActiveAlerts(): AlertTrigger[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Clears state for testing.
   */
  reset() {
    this.activeAlerts.clear();
    this.suppressionWindows.clear();
    this.occurrenceCounts.clear();
  }

  clear() {
    this.reset();
  }
}
