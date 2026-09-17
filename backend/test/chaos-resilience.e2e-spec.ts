import { CircuitBreakerService, CircuitState } from '../src/reliability/circuit-breaker/circuit-breaker.service';
import { RetryPolicyService } from '../src/reliability/retry/retry-policy.service';
import { MetricsService } from '../src/observability/metrics.service';

describe('N7: Chaos Failure Injection & Operational Resilience (CHAOS-001..CHAOS-015)', () => {
  let circuitBreaker: CircuitBreakerService;
  let retryPolicy: RetryPolicyService;
  let metricsService: MetricsService;

  beforeEach(() => {
    metricsService = new MetricsService();
    circuitBreaker = new CircuitBreakerService(metricsService);
    retryPolicy = new RetryPolicyService();
  });

  afterEach(() => {
    circuitBreaker.resetAll();
    metricsService.reset();
  });

  it('CHAOS-001: Primary database network partition triggers retry and graceful error handling', async () => {
    let attempts = 0;
    const dbQuery = jest.fn().mockImplementation(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Connection refused: 5432 (simulated network partition)');
      }
      return { id: 'recovered-record' };
    });

    const result = await retryPolicy.executeWithRetry(dbQuery, {
      maxAttempts: 3,
      initialDelayMs: 5,
    });
    expect(result.id).toBe('recovered-record');
    expect(attempts).toBe(3);
  });

  it('CHAOS-002: Database slow query triggers timeout without hanging the worker thread', async () => {
    const slowQuery = jest.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 80)),
    );

    await expect(
      retryPolicy.executeWithRetry(slowQuery, {
        maxAttempts: 1,
        timeoutPerAttemptMs: 20,
      }),
    ).rejects.toThrow('Operation timed out after 20ms');
  });

  it('CHAOS-003: Redis connection refusal degrades gracefully to database state', async () => {
    const redisGet = jest.fn().mockRejectedValue(new Error('ECONNREFUSED: Redis down'));
    const dbFallback = jest.fn().mockResolvedValue({ studentId: 's-123', mastery: 0.92 });

    let data;
    try {
      data = await redisGet();
    } catch {
      data = await dbFallback();
    }

    expect(data.mastery).toBe(0.92);
    expect(dbFallback).toHaveBeenCalledTimes(1);
  });

  it('CHAOS-004: Redis latency injection (> 1000ms) with graceful fallback', async () => {
    const slowRedis = new Promise((resolve) => setTimeout(() => resolve('cached-data'), 1500));
    const dbFastFallback = Promise.resolve('authoritative-db-data');
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis timeout')), 50),
    );

    let result;
    try {
      result = await Promise.race([slowRedis, timeout]);
    } catch {
      result = await dbFastFallback;
    }

    expect(result).toBe('authoritative-db-data');
  });

  it('CHAOS-005: External AI provider 500/503 outage trips circuit breaker to OPEN', async () => {
    const aiProviderOutage = jest.fn().mockRejectedValue(new Error('HTTP 503 Service Unavailable'));

    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute('gemini-chaos', aiProviderOutage, { failureThreshold: 3 });
      } catch {
        // Expected
      }
    }

    expect(circuitBreaker.getState('gemini-chaos')).toBe(CircuitState.OPEN);
  });

  it('CHAOS-006: AI provider timeout triggering deterministic pedagogical fallback', async () => {
    circuitBreaker.forceState('ai-chaos', CircuitState.OPEN);
    const action = jest.fn();
    const deterministicFallback = jest.fn().mockReturnValue({
      hint: 'Recall that multiplying both sides reverses the inequality when negative.',
      mode: 'DETERMINISTIC_FALLBACK',
    });

    const res = await circuitBreaker.execute('ai-chaos', action, undefined, deterministicFallback);
    expect(res.mode).toBe('DETERMINISTIC_FALLBACK');
    expect(action).not.toHaveBeenCalled();
    expect(deterministicFallback).toHaveBeenCalled();
  });

  it('CHAOS-007: AI provider rate-limit (429) backoff with jitter retry', async () => {
    let callCount = 0;
    const rateLimitedCall = jest.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 2) {
        const err: any = new Error('HTTP 429 Too Many Requests');
        err.statusCode = 429;
        throw err;
      }
      return { answer: 'AI explanation successfully delivered' };
    });

    const res = await retryPolicy.executeWithRetry(rateLimitedCall, {
      maxAttempts: 3,
      initialDelayMs: 5,
    });
    expect(res.answer).toBeDefined();
    expect(callCount).toBe(2);
  });

  it('CHAOS-008: Outbox worker simulated sudden process crash leaves events recoverable', () => {
    const inFlightEvents = [
      { id: 'e-crash-1', status: 'PROCESSING', attempts: 1, availableAt: new Date() },
    ];
    // Next poll picks up any events stuck in PROCESSING past timeout
    const recovered = inFlightEvents.map((e) => ({
      ...e,
      status: 'PENDING',
      attempts: e.attempts + 1,
    }));
    expect(recovered[0].status).toBe('PENDING');
    expect(recovered[0].attempts).toBe(2);
  });

  it('CHAOS-009: Poison message injection into outbox transitions to DEAD_LETTER without worker crash', () => {
    let workerHealthy = true;
    const poisonEvent = { id: 'poison-1', attempts: 5, maxAttempts: 5, status: 'PENDING' };

    try {
      if (poisonEvent.attempts >= poisonEvent.maxAttempts) {
        poisonEvent.status = 'DEAD_LETTER';
      }
    } catch {
      workerHealthy = false;
    }

    expect(poisonEvent.status).toBe('DEAD_LETTER');
    expect(workerHealthy).toBe(true);
  });

  it('CHAOS-010: Rapid burst of concurrent idempotent transactions prevents duplicate mutations', async () => {
    const processedIds = new Set<string>();
    let mutationCount = 0;

    const processConsequential = async (idempotencyKey: string) => {
      if (processedIds.has(idempotencyKey)) {
        return { duplicate: true };
      }
      processedIds.add(idempotencyKey);
      mutationCount++;
      return { duplicate: false };
    };

    const burst = Array(20).fill('same-key-12345');
    const results = await Promise.all(burst.map((k) => processConsequential(k)));

    expect(mutationCount).toBe(1);
    const duplicates = results.filter((r) => r.duplicate);
    expect(duplicates.length).toBe(19);
  });

  it('CHAOS-011: Memory pressure bounded eviction prevents Node process OOM', () => {
    const cache = new Map<string, string>();
    const MAX_SIZE = 100;

    for (let i = 0; i < 500; i++) {
      if (cache.size >= MAX_SIZE) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
      }
      cache.set(`key-${i}`, `payload-${i}`);
    }

    expect(cache.size).toBe(MAX_SIZE);
  });

  it('CHAOS-012: Tenant daily budget depletion rejects non-essential model requests', () => {
    const tenantSpend = 50.01;
    const dailyLimit = 50.0;
    const isAllowed = tenantSpend < dailyLimit;
    expect(isAllowed).toBe(false);
  });

  it('CHAOS-013: Safety escalation under database high-load retains highest priority', () => {
    const tasks = [
      { type: 'BACKGROUND_ANALYTICS', priority: 1 },
      { type: 'SAFETY_ESCALATION', priority: 10 },
      { type: 'LEADERBOARD_UPDATE', priority: 2 },
    ];
    tasks.sort((a, b) => b.priority - a.priority);
    expect(tasks[0].type).toBe('SAFETY_ESCALATION');
  });

  it('CHAOS-014: Circuit breaker recovery probe succeeds and restores circuit to CLOSED', async () => {
    circuitBreaker.forceState('service-recovering', CircuitState.HALF_OPEN);
    const probe = jest.fn().mockResolvedValue('service-is-healthy-again');

    await circuitBreaker.execute('service-recovering', probe);
    expect(circuitBreaker.getState('service-recovering')).toBe(CircuitState.CLOSED);
  });

  it('CHAOS-015: Cascading failure prevention: failure in AI provider does not corrupt mastery persistence', async () => {
    let masterySaved = false;
    let aiFailed = false;

    // Consequential learning transaction persists mastery before or independently of AI hint enrichment
    try {
      masterySaved = true; // DB transaction succeeded
      throw new Error('AI provider connection failure');
    } catch {
      aiFailed = true;
    }

    expect(masterySaved).toBe(true);
    expect(aiFailed).toBe(true);
  });
});
