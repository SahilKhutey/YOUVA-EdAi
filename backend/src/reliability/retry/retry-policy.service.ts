import { Injectable, Logger } from '@nestjs/common';

export interface RetryOptions {
  maxRetries?: number;
  maxAttempts?: number;
  baseDelayMs?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  timeoutPerAttemptMs?: number;
  isTransient?: (error: unknown) => boolean;
}

@Injectable()
export class RetryPolicyService {
  private readonly logger = new Logger(RetryPolicyService.name);

  /**
   * Default classifier distinguishing transient (retryable) errors from permanent errors.
   */
  static isTransientError(error: any): boolean {
    if (!error) return false;
    const msg = String(error.message || error).toLowerCase();
    const code = error.code || error.status || error.statusCode;

    // Permanent HTTP errors: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
    if (code === 400 || code === 401 || code === 403 || code === 404) {
      return false;
    }

    // Common transient network & database errors
    if (
      code === 429 || // Rate Limited
      code === 502 || // Bad Gateway
      code === 503 || // Service Unavailable
      code === 504 || // Gateway Timeout
      code === 'ECONNRESET' ||
      code === 'ETIMEDOUT' ||
      code === 'ECONNREFUSED' ||
      msg.includes('econnreset') ||
      msg.includes('etimedout') ||
      msg.includes('econnrefused') ||
      msg.includes('503') ||
      msg.includes('429') ||
      msg.includes('deadlock') ||
      msg.includes('connection reset') ||
      msg.includes('connection refused') ||
      msg.includes('network') ||
      msg.includes('partition') ||
      msg.includes('timeout') ||
      msg.includes('temporarily unavailable')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Instance helper for transient error check.
   */
  isTransientError(error: unknown): boolean {
    return RetryPolicyService.isTransientError(error);
  }

  /**
   * Calculates exponential delay with full jitter.
   */
  calculateDelay(
    attempt: number,
    baseDelayMs = 100,
    factor = 2,
    maxDelayMs = 5000,
  ): number {
    const rawDelay = baseDelayMs * Math.pow(factor, attempt - 1);
    const cappedDelay = Math.min(rawDelay, maxDelayMs);
    return Math.floor(Math.random() * cappedDelay) + 1;
  }


  /**
   * Executes an asynchronous operation with bounded exponential backoff and jitter.
   */
  async executeWithRetry<T = any>(
    action: (attempt: number) => Promise<T>,
    options?: RetryOptions,
  ): Promise<T>;
  async executeWithRetry<T = any>(
    operationName: string,
    action: (attempt: number) => Promise<T>,
    options?: RetryOptions,
  ): Promise<T>;
  async executeWithRetry<T = any>(
    arg1: string | ((attempt: number) => Promise<T>),
    arg2?: ((attempt: number) => Promise<T>) | RetryOptions,
    arg3?: RetryOptions,
  ): Promise<T> {
    let operationName: string;
    let action: (attempt: number) => Promise<T>;
    let options: RetryOptions;

    if (typeof arg1 === 'string') {
      operationName = arg1;
      action = arg2 as (attempt: number) => Promise<T>;
      options = arg3 || {};
    } else {
      operationName = '';
      action = arg1;
      options = (arg2 as RetryOptions) || {};
    }

    const totalTries =
      options.maxAttempts !== undefined
        ? options.maxAttempts
        : (options.maxRetries ?? 3) + 1;

    const baseDelayMs = options.initialDelayMs ?? options.baseDelayMs ?? 100;
    const maxDelayMs = options.maxDelayMs ?? 5000;
    const timeoutMs = options.timeoutPerAttemptMs ?? options.timeoutMs;
    const isTransient = options.isTransient ?? RetryPolicyService.isTransientError;

    let lastError: any;

    for (let attempt = 1; attempt <= totalTries; attempt++) {
      try {
        if (timeoutMs) {
          return await this.executeWithTimeout(action(attempt), timeoutMs, operationName);
        }
        return await action(attempt);
      } catch (err: any) {
        lastError = err;

        if (attempt >= totalTries || !isTransient(err)) {
          if (!isTransient(err)) {
            this.logger.debug(
              `Operation [${operationName || 'unnamed'}]: Non-transient error encountered. Fast-failing without retry: ${err.message}`,
            );
          } else {
            this.logger.warn(
              `Operation [${operationName || 'unnamed'}]: Max retries (${totalTries - 1}) exhausted. Final error: ${err.message}`,
            );
          }
          throw err;
        }

        // Full jitter exponential backoff: random between 0 and min(maxDelayMs, baseDelay * 2^(attempt-1))
        const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
        const jitteredDelay = Math.floor(Math.random() * exponential);

        this.logger.warn(
          `Operation [${operationName || 'unnamed'}]: Transient failure on attempt ${attempt}/${totalTries}. Retrying in ${jitteredDelay}ms. Reason: ${err.message}`,
        );

        await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
      }
    }

    throw lastError;
  }

  /**
   * Wraps a promise with a hard timeout.
   */
  async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName = '',
  ): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const prefix = operationName ? `Operation [${operationName}]` : 'Operation';
        reject(
          new Error(
            `${prefix} timed out after ${timeoutMs}ms`,
          ),
        );
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timer!);
    }
  }
}
