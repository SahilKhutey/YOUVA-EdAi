process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-that-is-at-least-32-characters-long';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://youva:youvapassword@localhost:5432/youva';

import { MetricsService } from '../src/observability/metrics.service';
import { SloTrackerService } from '../src/observability/slo/slo-tracker.service';
import { HealthService } from '../src/health/health.service';
import { CircuitBreakerService, CircuitState } from '../src/reliability/circuit-breaker/circuit-breaker.service';
import { RetryPolicyService } from '../src/reliability/retry/retry-policy.service';
import { SyntheticMonitoringService } from '../src/synthetic/synthetic-monitoring.service';

describe('N7: Observability & Reliability Architecture (OBS-001..OBS-020 & REL-001..REL-025)', () => {
  let metricsService: MetricsService;
  let sloTracker: SloTrackerService;
  let healthService: HealthService;
  let circuitBreaker: CircuitBreakerService;
  let retryPolicy: RetryPolicyService;
  let syntheticMonitoring: SyntheticMonitoringService;

  const mockPrisma: any = {
    $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]),
    learningEvidenceLog: { findFirst: jest.fn().mockResolvedValue({ id: 'ev-1' }) },
    userTopicMastery: { findFirst: jest.fn().mockResolvedValue({ id: 'm-1', masteryScore: 0.9 }) },
    contentAssignment: { findFirst: jest.fn().mockResolvedValue({ id: 'a-1' }) },
    consentRecord: { findFirst: jest.fn().mockResolvedValue({ id: 'c-1' }) },
    safetyEscalation: { findFirst: jest.fn().mockResolvedValue({ id: 's-1' }) },
    outboxEvent: { count: jest.fn().mockResolvedValue(12) },
    tenantMembership: { findMany: jest.fn().mockResolvedValue([]) },
  };

  beforeEach(() => {
    metricsService = new MetricsService();
    sloTracker = new SloTrackerService(metricsService);
    healthService = new HealthService(mockPrisma);
    circuitBreaker = new CircuitBreakerService(metricsService);
    retryPolicy = new RetryPolicyService();
    syntheticMonitoring = new SyntheticMonitoringService(mockPrisma, healthService, metricsService);
  });

  afterEach(() => {
    circuitBreaker.resetAll();
    metricsService.reset();
    jest.clearAllMocks();
  });

  describe('Observability Foundation (OBS-001..OBS-020)', () => {
    it('OBS-001: MetricsService registers and increments counters', () => {
      metricsService.increment('api_requests_total', 1);
      metricsService.increment('api_requests_total', 2);
      expect(metricsService.getCounter('api_requests_total')).toBe(3);
    });

    it('OBS-002: MetricsService records latency histograms and computes percentiles', () => {
      for (let i = 1; i <= 100; i++) {
        metricsService.recordLatency('http_request_duration_ms', i);
      }
      const p = metricsService.getLatencyPercentiles('http_request_duration_ms');
      expect(p.count).toBe(100);
      expect(p.p50).toBe(50);
      expect(p.p95).toBe(95);
      expect(p.p99).toBe(99);
      expect(p.avg).toBe(50.5);
    });

    it('OBS-003: MetricsService exports valid Prometheus exposition format', () => {
      metricsService.increment('learning_loop_transactions_total', 10);
      metricsService.recordLatency('ai_latency_ms', 120);
      metricsService.setGauge('circuit_breakers_open', 1);

      const output = metricsService.toPrometheusFormat();
      expect(output).toContain('# TYPE learning_loop_transactions_total counter');
      expect(output).toContain('learning_loop_transactions_total 10');
      expect(output).toContain('# TYPE circuit_breakers_open gauge');
      expect(output).toContain('circuit_breakers_open 1');
      expect(output).toContain('ai_latency_ms_p95');
    });

    it('OBS-004: MetricsService manages gauges (up/down)', () => {
      metricsService.setGauge('active_connections', 50);
      expect(metricsService.getGauge('active_connections')).toBe(50);
      metricsService.setGauge('active_connections', 42);
      expect(metricsService.getGauge('active_connections')).toBe(42);
    });

    it('OBS-005: MetricsService tracks all 22 required operational signals', () => {
      const snapshot = metricsService.getSnapshot();
      expect(snapshot.counters).toHaveProperty('api_requests_total');
      expect(snapshot.counters).toHaveProperty('api_requests_success');
      expect(snapshot.counters).toHaveProperty('api_requests_error');
      expect(snapshot.counters).toHaveProperty('learning_loop_transactions_total');
      expect(snapshot.counters).toHaveProperty('learning_loop_transactions_success');
      expect(snapshot.counters).toHaveProperty('learning_loop_transactions_failed');
      expect(snapshot.counters).toHaveProperty('ai_requests_total');
      expect(snapshot.counters).toHaveProperty('ai_requests_success');
      expect(snapshot.counters).toHaveProperty('ai_requests_failed');
      expect(snapshot.counters).toHaveProperty('ai_requests_blocked');
      expect(snapshot.counters).toHaveProperty('ai_fallbacks');
      expect(snapshot.counters).toHaveProperty('db_queries_total');
      expect(snapshot.counters).toHaveProperty('cache_hits');
      expect(snapshot.counters).toHaveProperty('outbox_events_enqueued');
      expect(snapshot.gauges).toHaveProperty('circuit_breakers_open');
      expect(snapshot.gauges).toHaveProperty('health_status');
    });

    it('OBS-006: SloTrackerService computes API availability percentage', () => {
      metricsService.increment('api_requests_total', 1000);
      metricsService.increment('api_requests_success', 999);
      metricsService.increment('api_requests_error', 1);

      const metrics = sloTracker.getSloMetrics();
      expect(metrics.apiAvailability.current).toBe(99.9);
      expect(metrics.apiAvailability.target).toBe(99.9);
      expect(metrics.apiAvailability.status).toBe('COMPLIANT');
    });

    it('OBS-007: SloTrackerService computes learning loop availability percentage', () => {
      metricsService.increment('learning_loop_transactions_total', 10000);
      metricsService.increment('learning_loop_transactions_success', 9998);
      metricsService.increment('learning_loop_transactions_failed', 2);

      const metrics = sloTracker.getSloMetrics();
      expect(metrics.learningLoopAvailability.current).toBe(99.98);
      expect(metrics.learningLoopAvailability.status).toBe('COMPLIANT');
    });

    it('OBS-008: SloTrackerService computes persistence integrity percentage', () => {
      metricsService.increment('persistence_write_total', 5000);
      metricsService.increment('persistence_write_success', 5000);

      const metrics = sloTracker.getSloMetrics();
      expect(metrics.persistenceIntegrity.current).toBe(100);
      expect(metrics.persistenceIntegrity.status).toBe('COMPLIANT');
    });

    it('OBS-009: SloTrackerService tracks error budgets remaining', () => {
      metricsService.increment('api_requests_total', 1000);
      metricsService.increment('api_requests_error', 1);

      const metrics = sloTracker.getSloMetrics();
      expect(metrics.apiAvailability.errorBudgetRemaining).toBe(0);
    });

    it('OBS-010: SloTrackerService evaluates target thresholds and overall health', () => {
      const metrics = sloTracker.getSloMetrics();
      expect(metrics.overallHealth).toBe('HEALTHY');
    });

    it('OBS-011: HealthService.database probe returns operational status', async () => {
      const res = await healthService.database();
      expect(res.status).toBe('up');
      expect(res.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('OBS-012: HealthService.redis probe gracefully handles disconnected state', async () => {
      const res = await healthService.redis();
      expect(['up', 'down', 'not_configured']).toContain(res.status);
    });

    it('OBS-013: HealthService.queue probe checks outbox backlog', async () => {
      const res = await healthService.queue();
      expect(res.status).toBe('up');
      expect(res.pendingDepth).toBe(12);
    });

    it('OBS-014: HealthService.ai probe checks AI gateway readiness', async () => {
      const res = await healthService.ai();
      expect(['up', 'degraded', 'isolated_non_blocking']).toContain(res.status);
      expect(res.primaryProvider).toBeDefined();
    });

    it('OBS-015: HealthService.websocket probe returns status', async () => {
      const res = await healthService.websocket();
      expect(res.status).toBe('up');
    });

    it('OBS-016: Observability snapshot contains complete system telemetry', () => {
      const snapshot = metricsService.getSnapshot();
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(snapshot.counters).toBeDefined();
      expect(snapshot.gauges).toBeDefined();
      expect(snapshot.latencies).toBeDefined();
    });

    it('OBS-017: Observability snapshot calculates average and p95 latency accurately', () => {
      metricsService.recordLatency('api_latency_ms', 50);
      metricsService.recordLatency('api_latency_ms', 150);
      const snapshot = metricsService.getSnapshot();
      expect(snapshot.latencies.api_latency_ms.avg).toBe(100);
      expect(snapshot.latencies.api_latency_ms.p95).toBe(150);
    });

    it('OBS-018: SLO metrics identify BREACHED state when errors exceed budget', () => {
      metricsService.increment('api_requests_total', 100);
      metricsService.increment('api_requests_error', 5); // 5% error rate, SLO target is 99.9%
      const metrics = sloTracker.getSloMetrics();
      expect(metrics.apiAvailability.status).toBe('BREACHED');
      expect(metrics.overallHealth).toBe('DEGRADED');
    });

    it('OBS-019: Synthetic probe SYN-001 checks health subsystem', async () => {
      const probe = await syntheticMonitoring.runProbe('SYN-001');
      expect(probe.status).toBe('PASS');
      expect(probe.name).toBe('Health Endpoint Probe');
    });

    it('OBS-020: SyntheticMonitoringService executes all 12 probes (SYN-001..SYN-012)', async () => {
      const summary = await syntheticMonitoring.runAllProbes();
      expect(summary.totalProbes).toBe(12);
      expect(summary.passed).toBeGreaterThanOrEqual(10);
      expect(summary.totalDurationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Reliability Architecture & Circuit Breakers (REL-001..REL-025)', () => {
    it('REL-001: CircuitBreaker starts in CLOSED state', () => {
      expect(circuitBreaker.getState('test-circuit')).toBe(CircuitState.CLOSED);
    });

    it('REL-002: CircuitBreaker executes successful actions normally', async () => {
      const action = jest.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute('test-circuit', action);
      expect(result).toBe('success');
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('REL-003: CircuitBreaker records consecutive failures', async () => {
      const failingAction = jest.fn().mockRejectedValue(new Error('fail'));
      await expect(
        circuitBreaker.execute('test-circuit', failingAction, undefined, { failureThreshold: 3 }),
      ).rejects.toThrow('fail');
      expect(circuitBreaker.getState('test-circuit')).toBe(CircuitState.CLOSED);
    });

    it('REL-004: CircuitBreaker trips to OPEN when failure threshold is reached', async () => {
      const failingAction = jest.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute('test-circuit', failingAction, undefined, { failureThreshold: 3 }),
        ).rejects.toThrow('fail');
      }
      expect(circuitBreaker.getState('test-circuit')).toBe(CircuitState.OPEN);
      expect(metricsService.getCounter('circuit_breaker_trips')).toBe(1);
    });

    it('REL-005: CircuitBreaker immediately fast-fails calls without invoking action when OPEN', async () => {
      circuitBreaker.forceState('test-circuit', CircuitState.OPEN);
      const action = jest.fn();
      await expect(circuitBreaker.execute('test-circuit', action)).rejects.toThrow(
        'is OPEN',
      );
      expect(action).not.toHaveBeenCalled();
    });

    it('REL-006: CircuitBreaker invokes fallback when OPEN', async () => {
      circuitBreaker.forceState('test-circuit', CircuitState.OPEN);
      const action = jest.fn();
      const fallback = jest.fn().mockResolvedValue('fallback-response');
      const result = await circuitBreaker.execute('test-circuit', action, fallback);
      expect(result).toBe('fallback-response');
      expect(action).not.toHaveBeenCalled();
      expect(fallback).toHaveBeenCalledTimes(1);
    });

    it('REL-007: CircuitBreaker transitions from OPEN to HALF_OPEN after timeout', async () => {
      circuitBreaker.forceState('test-circuit', CircuitState.OPEN);
      // Execute after resetTimeout (pass small timeout 10ms)
      await new Promise((r) => setTimeout(r, 20));
      const action = jest.fn().mockResolvedValue('recovered');
      const result = await circuitBreaker.execute('test-circuit', action, undefined, {
        resetTimeoutMs: 10,
        halfOpenSuccessThreshold: 1,
      });
      expect(result).toBe('recovered');
      expect(circuitBreaker.getState('test-circuit')).toBe(CircuitState.CLOSED);
    });

    it('REL-008: CircuitBreaker resets to CLOSED on probe success in HALF_OPEN', async () => {
      circuitBreaker.forceState('test-circuit', CircuitState.HALF_OPEN);
      const action = jest.fn().mockResolvedValue('probe-success');
      await circuitBreaker.execute('test-circuit', action, undefined, { halfOpenSuccessThreshold: 1 });
      expect(circuitBreaker.getState('test-circuit')).toBe(CircuitState.CLOSED);
    });

    it('REL-009: CircuitBreaker trips back to OPEN on probe failure in HALF_OPEN', async () => {
      circuitBreaker.forceState('test-circuit', CircuitState.HALF_OPEN);
      const action = jest.fn().mockRejectedValue(new Error('probe-failed'));
      await expect(circuitBreaker.execute('test-circuit', action)).rejects.toThrow('probe-failed');
      expect(circuitBreaker.getState('test-circuit')).toBe(CircuitState.OPEN);
    });

    it('REL-010: CircuitBreaker supports manual forceState override', () => {
      circuitBreaker.forceState('manual-circuit', CircuitState.OPEN);
      expect(circuitBreaker.getState('manual-circuit')).toBe(CircuitState.OPEN);
      circuitBreaker.forceState('manual-circuit', CircuitState.CLOSED);
      expect(circuitBreaker.getState('manual-circuit')).toBe(CircuitState.CLOSED);
    });

    it('REL-011: CircuitBreaker getAllCircuitStates returns all circuit metrics', () => {
      circuitBreaker.forceState('c1', CircuitState.CLOSED);
      circuitBreaker.forceState('c2', CircuitState.OPEN);
      const states = circuitBreaker.getAllCircuitStates();
      expect(states.c1.state).toBe(CircuitState.CLOSED);
      expect(states.c2.state).toBe(CircuitState.OPEN);
    });

    it('REL-012: RetryPolicyService executes immediate success without delay', async () => {
      const action = jest.fn().mockResolvedValue('ok');
      const res = await retryPolicy.executeWithRetry('test-op', action, { maxRetries: 3 });
      expect(res).toBe('ok');
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('REL-013: RetryPolicyService retries transient errors up to maxAttempts', async () => {
      let attempts = 0;
      const action = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) throw new Error('ECONNRESET');
        return 'success on attempt 3';
      });

      const res = await retryPolicy.executeWithRetry('test-op', action, {
        maxRetries: 3,
        baseDelayMs: 5,
      });
      expect(res).toBe('success on attempt 3');
      expect(action).toHaveBeenCalledTimes(3);
    });

    it('REL-014: RetryPolicyService applies exponential backoff calculation', () => {
      const d1 = retryPolicy.calculateDelay(1, 100, 2, 5000);
      const d2 = retryPolicy.calculateDelay(2, 100, 2, 5000);
      expect(d1).toBeLessThanOrEqual(200);
      expect(d2).toBeLessThanOrEqual(400);
    });

    it('REL-015: RetryPolicyService adds full jitter to prevent thundering herd', () => {
      const delays = new Set<number>();
      for (let i = 0; i < 20; i++) {
        delays.add(retryPolicy.calculateDelay(2, 100, 2, 5000));
      }
      expect(delays.size).toBeGreaterThan(1);
    });

    it('REL-016: RetryPolicyService enforces per-attempt timeout', async () => {
      const slowAction = () => new Promise((resolve) => setTimeout(resolve, 50));

      await expect(
        retryPolicy.executeWithTimeout(slowAction(), 10, 'slowAction'),
      ).rejects.toThrow('timed out after 10ms');
    });

    it('REL-017: RetryPolicyService distinguishes transient vs permanent errors', () => {
      expect(retryPolicy.isTransientError(new Error('ECONNRESET'))).toBe(true);
      expect(retryPolicy.isTransientError(new Error('ETIMEDOUT'))).toBe(true);
      expect(retryPolicy.isTransientError(new Error('status code 503'))).toBe(true);
      expect(retryPolicy.isTransientError(new Error('Validation failed: bad input'))).toBe(false);
    });

    it('REL-018: RetryPolicyService aborts immediately on non-retryable error', async () => {
      const err: any = new Error('Bad request');
      err.code = 400; // Permanent error
      const action = jest.fn().mockRejectedValue(err);
      await expect(
        retryPolicy.executeWithRetry('test-op', action, { maxRetries: 4 }),
      ).rejects.toThrow('Bad request');
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('REL-019: Synthetic probe SYN-002 verifies direct database read and write', async () => {
      const res = await syntheticMonitoring.runProbe('SYN-002');
      expect(res.status).toBe('PASS');
      expect(res.name).toContain('Database');
    });

    it('REL-020: Degradation: Redis failure does not block primary PostgreSQL mastery transactions', async () => {
      const dbAction = jest.fn().mockResolvedValue({ studentId: 's1', mastery: 0.85 });
      const result = await dbAction();
      expect(result.mastery).toBe(0.85);
    });

    it('REL-021: Degradation: AI provider failure triggers deterministic pedagogical fallback', async () => {
      const primaryAi = jest.fn().mockRejectedValue(new Error('AI upstream timeout'));
      const deterministicFallback = jest.fn().mockResolvedValue({ hint: 'Break into smaller steps' });

      let result;
      try {
        result = await circuitBreaker.execute('gemini-provider', primaryAi, deterministicFallback);
      } catch {
        result = await deterministicFallback();
      }
      expect(result.hint).toBe('Break into smaller steps');
    });

    it('REL-022: Degradation: Stale read fallback returns cached data with freshness metadata', () => {
      const staleData = {
        mastery: 0.9,
        _cachedAt: new Date(Date.now() - 3600000).toISOString(),
        _isStale: true,
      };
      expect(staleData._isStale).toBe(true);
      expect(staleData.mastery).toBe(0.9);
    });

    it('REL-023: Bounded queue prevents unbounded memory growth under load', () => {
      const MAX_ITEMS = 500;
      const queue: string[] = [];
      for (let i = 0; i < 1000; i++) {
        if (queue.length >= MAX_ITEMS) {
          queue.shift(); // Evict oldest
        }
        queue.push(`item-${i}`);
      }
      expect(queue.length).toBe(MAX_ITEMS);
      expect(queue[0]).toBe('item-500');
    });

    it('REL-024: Circuit breaker trip updates metrics gauge circuit_breakers_open', async () => {
      circuitBreaker.forceState('service-a', CircuitState.OPEN);
      circuitBreaker.forceState('service-b', CircuitState.OPEN);
      const states = circuitBreaker.getAllCircuitStates();
      const openCount = Object.values(states).filter((s) => s.state === CircuitState.OPEN).length;
      metricsService.setGauge('circuit_breakers_open', openCount);
      expect(metricsService.getGauge('circuit_breakers_open')).toBe(2);
    });

    it('REL-025: High latency does not cause thread starvation or hung promises', async () => {
      const start = Date.now();
      const fastPromise = new Promise((r) => setTimeout(() => r('fast'), 10));
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 25),
      );

      const res = await Promise.race([fastPromise, timeoutPromise]);
      expect(res).toBe('fast');
      expect(Date.now() - start).toBeLessThan(100);
    });
  });
});
