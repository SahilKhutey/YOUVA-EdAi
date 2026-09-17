import { Injectable } from '@nestjs/common';

export interface MetricSnapshot {
  metrics: Record<string, number>;
  gauges: Record<string, number>;
  latencyPercentiles: Record<
    string,
    { avg: number; p50: number; p95: number; p99: number; count: number }
  >;
  timestamp: string;
}

@Injectable()
export class MetricsService {
  private readonly counters = new Map<string, number>();
  private readonly gauges = new Map<string, number>();
  private readonly latencies = new Map<string, number[]>();
  private readonly startTime = Date.now();

  // 22 Canonical Operational Signals defined in N7-A
  public static readonly SIGNALS = [
    'request_count',
    'request_latency',
    'request_errors',
    'auth_failures',
    'authorization_failures',
    'tenant_isolation_failures',
    'learning_attempts',
    'learning_attempt_failures',
    'mastery_updates',
    'mastery_update_failures',
    'ai_requests',
    'ai_failures',
    'ai_latency',
    'ai_cost',
    'safety_events',
    'safety_escalations',
    'teacher_interventions',
    'notifications',
    'queue_depth',
    'queue_failures',
    'database_latency',
    'redis_latency',
    'websocket_connections',
  ] as const;

  constructor() {
    this.initializeDefaultSignals();
  }

  private initializeDefaultSignals() {
    for (const signal of MetricsService.SIGNALS) {
      if (signal.includes('latency')) {
        if (!this.latencies.has(signal)) this.latencies.set(signal, []);
      } else if (signal === 'queue_depth' || signal === 'websocket_connections') {
        if (!this.gauges.has(signal)) this.gauges.set(signal, 0);
      } else {
        if (!this.counters.has(signal)) this.counters.set(signal, 0);
      }
    }

    const additionalCounters = [
      'api_requests_total',
      'api_requests_success',
      'api_requests_error',
      'learning_loop_transactions_total',
      'learning_loop_transactions_success',
      'learning_loop_transactions_failed',
      'ai_requests_total',
      'ai_requests_success',
      'ai_requests_failed',
      'ai_requests_blocked',
      'ai_fallbacks',
      'db_queries_total',
      'cache_hits',
      'outbox_events_enqueued',
    ];

    for (const c of additionalCounters) {
      if (!this.counters.has(c)) this.counters.set(c, 0);
    }

    if (!this.gauges.has('circuit_breakers_open')) this.gauges.set('circuit_breakers_open', 0);
    if (!this.gauges.has('health_status')) this.gauges.set('health_status', 1);
  }

  /**
   * Increments a monotonic counter.
   */
  increment(metricName: string, value = 1) {
    const current = this.counters.get(metricName) || 0;
    this.counters.set(metricName, current + value);
  }

  /**
   * Sets the instantaneous value of a gauge.
   */
  setGauge(metricName: string, value: number) {
    this.gauges.set(metricName, value);
  }

  /**
   * Records a latency observation in milliseconds.
   */
  recordLatency(metricName: string, durationMs: number) {
    const list = this.latencies.get(metricName) || [];
    list.push(durationMs);
    // Keep last 1000 observations to prevent memory unbounded growth
    if (list.length > 1000) {
      list.shift();
    }
    this.latencies.set(metricName, list);
  }

  /**
   * Records AI financial cost in USD.
   */
  recordAiCost(amountUsd: number) {
    const current = this.counters.get('ai_cost') || 0;
    this.counters.set('ai_cost', Number((current + amountUsd).toFixed(6)));
  }

  /**
   * Returns current value of counter.
   */
  getCounter(metricName: string): number {
    return this.counters.get(metricName) || 0;
  }

  /**
   * Returns current value of gauge.
   */
  getGauge(metricName: string): number {
    return this.gauges.get(metricName) || 0;
  }

  /**
   * Helper to compute latency percentiles.
   */
  getLatencyPercentiles(metricName: string) {
    const arr = this.latencies.get(metricName) || [];
    if (arr.length === 0) {
      return { avg: 0, p50: 0, p95: 0, p99: 0, count: 0 };
    }
    const sorted = [...arr].sort((a, b) => a - b);
    const p50 = sorted[Math.floor((sorted.length - 1) * 0.5)];
    const p95 = sorted[Math.floor((sorted.length - 1) * 0.95)];
    const p99 = sorted[Math.floor((sorted.length - 1) * 0.99)];
    const avg = Number((sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(1));

    return {
      avg,
      p50,
      p95,
      p99,
      count: sorted.length,
    };
  }

  /**
   * Returns a complete JSON snapshot of all operational metrics.
   */
  getSnapshot(): MetricSnapshot & {
    counters: Record<string, number>;
    latencies: Record<string, { avg: number; p50: number; p95: number; p99: number; count: number }>;
    uptimeSeconds: number;
  } {
    const metrics: Record<string, number> = {};
    const gauges: Record<string, number> = {};
    const latencyPercentiles: Record<
      string,
      { avg: number; p50: number; p95: number; p99: number; count: number }
    > = {};

    this.counters.forEach((val, key) => {
      metrics[key] = val;
    });

    this.gauges.forEach((val, key) => {
      gauges[key] = val;
    });

    this.latencies.forEach((arr, key) => {
      if (arr.length === 0) {
        latencyPercentiles[key] = { avg: 0, p50: 0, p95: 0, p99: 0, count: 0 };
        return;
      }
      const sorted = [...arr].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];
      const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);

      latencyPercentiles[key] = {
        avg,
        p50,
        p95,
        p99,
        count: sorted.length,
      };

      // Legacy flat keys for backward compatibility
      metrics[`${key}_avg_ms`] = avg;
      metrics[`${key}_p50_ms`] = p50;
      metrics[`${key}_p95_ms`] = p95;
      metrics[`${key}_p99_ms`] = p99;
    });

    return {
      metrics,
      counters: metrics,
      gauges,
      latencyPercentiles,
      latencies: latencyPercentiles,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Formats metrics in standard Prometheus exposition text format.
   */
  toPrometheusFormat(): string {
    const lines: string[] = [
      '# HELP youva_operational_metrics YOUVA-EdAI Core Operational Telemetry',
      '# TYPE youva_operational_metrics gauge',
    ];

    this.counters.forEach((val, key) => {
      lines.push(`# TYPE ${key} counter`);
      lines.push(`${key} ${val}`);
      lines.push(`youva_${key}_total ${val}`);
    });

    this.gauges.forEach((val, key) => {
      lines.push(`# TYPE ${key} gauge`);
      lines.push(`${key} ${val}`);
      lines.push(`youva_${key} ${val}`);
    });

    this.latencies.forEach((arr, key) => {
      if (arr.length === 0) return;
      const sorted = [...arr].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];
      const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);

      lines.push(`${key}_avg_ms ${avg}`);
      lines.push(`${key}_p50_ms ${p50}`);
      lines.push(`${key}_p95_ms ${p95}`);
      lines.push(`${key}_p99_ms ${p99}`);
      lines.push(`youva_${key}_avg_ms ${avg}`);
      lines.push(`youva_${key}_p50_ms ${p50}`);
      lines.push(`youva_${key}_p95_ms ${p95}`);
      lines.push(`youva_${key}_p99_ms ${p99}`);
    });

    return lines.join('\n') + '\n';
  }

  /**
   * Resets all metric buffers (used primarily in test suites).
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.latencies.clear();
    this.initializeDefaultSignals();
  }
}
