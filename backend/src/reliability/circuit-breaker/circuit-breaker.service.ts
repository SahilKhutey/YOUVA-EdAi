import { Injectable, Logger, Optional } from '@nestjs/common';
import { MetricsService } from '../../observability/metrics.service';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  halfOpenSuccessThreshold?: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly breakers = new Map<
    string,
    {
      state: CircuitState;
      failureCount: number;
      successCount: number;
      lastFailureTime: number;
      options: Required<CircuitBreakerOptions>;
    }
  >();

  private readonly defaultOptions: Required<CircuitBreakerOptions> = {
    failureThreshold: 5,
    resetTimeoutMs: 10000, // 10 seconds
    halfOpenSuccessThreshold: 1,
  };

  constructor(@Optional() private readonly metricsService?: MetricsService) {}

  /**
   * Executes an action protected by the named circuit breaker.
   * If the circuit is OPEN, immediately executes the fallback or throws.
   */
  async execute<T = any>(
    circuitName: string,
    action: () => Promise<T>,
    fallback?: () => Promise<T> | T,
    customOptions?: CircuitBreakerOptions,
  ): Promise<T>;
  async execute<T = any>(
    circuitName: string,
    action: () => Promise<T>,
    customOptions?: CircuitBreakerOptions,
    fallback?: () => Promise<T> | T,
  ): Promise<T>;
  async execute<T = any>(
    circuitName: string,
    action: () => Promise<T>,
    arg3?: any,
    arg4?: any,
  ): Promise<T> {
    let fallback: (() => Promise<T> | T) | undefined;
    let customOptions: CircuitBreakerOptions | undefined;

    if (typeof arg3 === 'function') {
      fallback = arg3;
    } else if (typeof arg3 === 'object' && arg3 !== null) {
      customOptions = arg3;
    }

    if (typeof arg4 === 'function') {
      fallback = arg4;
    } else if (typeof arg4 === 'object' && arg4 !== null) {
      customOptions = arg4;
    }

    const breaker = this.getOrCreateBreaker(circuitName, customOptions);
    if (customOptions) {
      breaker.options = { ...breaker.options, ...customOptions };
    }
    const now = Date.now();

    // Check state transitions
    if (breaker.state === CircuitState.OPEN) {
      if (now - breaker.lastFailureTime >= breaker.options.resetTimeoutMs) {
        this.logger.log(
          `CircuitBreaker [${circuitName}]: Cooldown expired. Transitioning from OPEN to HALF_OPEN probe state.`,
        );
        breaker.state = CircuitState.HALF_OPEN;
        breaker.successCount = 0;
      } else {
        this.logger.warn(
          `CircuitBreaker [${circuitName}]: Circuit is OPEN. Fast-failing action.`,
        );
        if (fallback) {
          return await fallback();
        }
        throw new Error(
          `CircuitBreaker [${circuitName}] is OPEN. Downstream service unavailable.`,
        );
      }
    }

    try {
      const result = await action();

      if (breaker.state === CircuitState.HALF_OPEN) {
        breaker.successCount++;
        if (breaker.successCount >= breaker.options.halfOpenSuccessThreshold) {
          this.logger.log(
            `CircuitBreaker [${circuitName}]: Success threshold met. Transitioning from HALF_OPEN to CLOSED.`,
          );
          breaker.state = CircuitState.CLOSED;
          breaker.failureCount = 0;
          breaker.successCount = 0;
        }
      } else if (breaker.state === CircuitState.CLOSED) {
        breaker.failureCount = 0;
      }

      return result;
    } catch (err) {
      breaker.failureCount++;
      breaker.lastFailureTime = Date.now();

      if (
        breaker.state === CircuitState.HALF_OPEN ||
        breaker.failureCount >= breaker.options.failureThreshold
      ) {
        this.logger.error(
          `CircuitBreaker [${circuitName}]: Failure threshold reached (${breaker.failureCount}/${breaker.options.failureThreshold}). Tripping circuit to OPEN.`,
        );
        breaker.state = CircuitState.OPEN;
        breaker.lastFailureTime = Date.now();
        this.metricsService?.increment('circuit_breaker_trips');
      }

      if (fallback) {
        this.logger.log(`CircuitBreaker [${circuitName}]: Invoking fallback.`);
        return await fallback();
      }

      throw err;
    }
  }

  /**
   * Retrieves the current state of a circuit breaker.
   */
  getState(circuitName: string): CircuitState {
    const breaker = this.breakers.get(circuitName);
    return breaker ? breaker.state : CircuitState.CLOSED;
  }

  /**
   * Retrieves states of all registered circuit breakers.
   */
  getAllCircuitStates(): Record<string, { state: CircuitState; failureCount: number }> {
    const result: Record<string, { state: CircuitState; failureCount: number }> = {};
    for (const [name, breaker] of this.breakers.entries()) {
      result[name] = { state: breaker.state, failureCount: breaker.failureCount };
    }
    return result;
  }

  /**
   * Forces a circuit breaker state (useful for chaos testing).
   */
  forceState(circuitName: string, state: CircuitState) {
    const breaker = this.getOrCreateBreaker(circuitName);
    breaker.state = state;
    if (state === CircuitState.OPEN) {
      breaker.lastFailureTime = Date.now();
    }
  }

  /**
   * Resets all circuit breakers.
   */
  resetAll() {
    this.breakers.clear();
  }

  private getOrCreateBreaker(circuitName: string, customOptions?: CircuitBreakerOptions) {
    if (!this.breakers.has(circuitName)) {
      this.breakers.set(circuitName, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        successCount: 0,
        lastFailureTime: 0,
        options: {
          ...this.defaultOptions,
          ...customOptions,
        },
      });
    }
    return this.breakers.get(circuitName)!;
  }
}
