import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private readonly counters = new Map<string, number>();
  private readonly latencies = new Map<string, number[]>();

  increment(metricName: string, value = 1) {
    const current = this.counters.get(metricName) || 0;
    this.counters.set(metricName, current + value);
  }

  recordLatency(metricName: string, durationMs: number) {
    const list = this.latencies.get(metricName) || [];
    list.push(durationMs);
    // Keep last 1000 observations to prevent memory leaks
    if (list.length > 1000) {
      list.shift();
    }
    this.latencies.set(metricName, list);
  }

  getSnapshot() {
    const snapshot: Record<string, any> = {};

    this.counters.forEach((val, key) => {
      snapshot[key] = val;
    });

    this.latencies.forEach((arr, key) => {
      if (arr.length === 0) return;
      const sorted = [...arr].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];
      const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);

      snapshot[`${key}_avg_ms`] = avg;
      snapshot[`${key}_p50_ms`] = p50;
      snapshot[`${key}_p95_ms`] = p95;
      snapshot[`${key}_p99_ms`] = p99;
    });

    return {
      metrics: snapshot,
      timestamp: new Date().toISOString(),
    };
  }
}
