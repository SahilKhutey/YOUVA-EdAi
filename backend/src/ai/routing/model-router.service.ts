import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AiProvider, ModelPolicy } from '../interfaces/ai-provider.interface';
import { GeminiProvider } from '../providers/gemini.provider';
import { OllamaProvider } from '../providers/ollama.provider';
import { DeterministicFallbackProvider } from '../providers/deterministic-fallback.provider';
import { MockAiProvider } from '../providers/mock.provider';

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  consecutiveFailures: number;
  lastFailureTime: number;
}

@Injectable()
export class ModelRouterService {
  private readonly logger = new Logger(ModelRouterService.name);
  private readonly providers = new Map<string, AiProvider>();
  private readonly circuitBreakers = new Map<string, CircuitBreakerState>();

  private readonly TRIP_THRESHOLD = 3;
  private readonly RESET_TIMEOUT_MS = 30000;

  constructor(
    private readonly geminiProvider: GeminiProvider,
    private readonly ollamaProvider: OllamaProvider,
    private readonly fallbackProvider: DeterministicFallbackProvider,
    private readonly mockProvider: MockAiProvider,
  ) {
    this.registerProvider(this.geminiProvider);
    this.registerProvider(this.ollamaProvider);
    this.registerProvider(this.fallbackProvider);
    this.registerProvider(this.mockProvider);
  }

  private registerProvider(provider: AiProvider) {
    this.providers.set(provider.name, provider);
    this.circuitBreakers.set(provider.name, {
      state: 'CLOSED',
      consecutiveFailures: 0,
      lastFailureTime: 0,
    });
  }

  getProvider(name: string): AiProvider | undefined {
    return this.providers.get(name);
  }

  getAllProviders(): AiProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Evaluates circuit breaker state. Returns true if provider can be called.
   */
  canCallProvider(name: string): boolean {
    const cb = this.circuitBreakers.get(name);
    if (!cb) return true;

    if (cb.state === 'CLOSED') return true;

    if (cb.state === 'OPEN') {
      const now = Date.now();
      if (now - cb.lastFailureTime > this.RESET_TIMEOUT_MS) {
        cb.state = 'HALF_OPEN';
        this.logger.log(`Circuit breaker for provider ${name} transitioning to HALF_OPEN.`);
        return true;
      }
      return false;
    }

    // HALF_OPEN allows single probe
    return true;
  }

  /**
   * Records successful generation for a provider.
   */
  recordSuccess(name: string) {
    const cb = this.circuitBreakers.get(name);
    if (cb) {
      cb.state = 'CLOSED';
      cb.consecutiveFailures = 0;
    }
  }

  /**
   * Records failure for a provider. Trips circuit breaker if threshold met.
   */
  recordFailure(name: string, error: Error) {
    const cb = this.circuitBreakers.get(name);
    if (!cb) return;

    cb.consecutiveFailures++;
    cb.lastFailureTime = Date.now();

    if (cb.consecutiveFailures >= this.TRIP_THRESHOLD) {
      cb.state = 'OPEN';
      this.logger.warn(
        `Circuit breaker TRIPPED for provider ${name} after ${cb.consecutiveFailures} consecutive failures: ${error.message}`,
      );
    }
  }

  /**
   * Selects the highest-priority reachable provider matching policy.
   */
  async selectProvider(policy: ModelPolicy): Promise<AiProvider> {
    if (!policy || !Array.isArray(policy.allowedProviders) || policy.allowedProviders.length === 0) {
      throw new BadRequestException('ModelPolicy must specify at least one allowedProvider.');
    }

    for (const name of policy.allowedProviders) {
      const provider = this.providers.get(name);
      if (!provider) continue;

      if (!this.canCallProvider(name)) {
        this.logger.warn(`Provider ${name} is blocked by Circuit Breaker (OPEN). Trying next.`);
        continue;
      }

      try {
        const available = await provider.isAvailable();
        if (available) {
          return provider;
        }
      } catch (err) {
        this.logger.warn(`Provider ${name} availability check failed: ${err.message}`);
      }
    }

    // If allowed providers failed or are unavailable, evaluate fallback
    if (policy.fallbackAllowed) {
      this.logger.warn('All allowed providers unavailable. Routing to deterministic fallback.');
      return this.fallbackProvider;
    }

    throw new BadRequestException(
      `No available provider found matching policy for capability ${policy.capability}. Allowed: ${policy.allowedProviders.join(', ')}`,
    );
  }

  /**
   * Returns live diagnostic status for all circuit breakers.
   */
  getCircuitStatus(): Record<string, CircuitBreakerState> {
    const status: Record<string, CircuitBreakerState> = {};
    this.circuitBreakers.forEach((val, key) => {
      status[key] = { ...val };
    });
    return status;
  }

  /**
   * Resets all circuit breakers (primarily for tests).
   */
  resetCircuits(): void {
    this.circuitBreakers.forEach((cb) => {
      cb.state = 'CLOSED';
      cb.consecutiveFailures = 0;
      cb.lastFailureTime = 0;
    });
  }
}
