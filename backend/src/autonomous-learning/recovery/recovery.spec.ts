import { calculateBackoff } from './retry.service';
import { CircuitBreaker } from './circuit-breaker';

describe('calculateBackoff', () => {
  it('increases with attempts', () => {
    expect(calculateBackoff(3)).toBeGreaterThan(calculateBackoff(1));
  });

  it('respects maximum delay', () => {
    expect(calculateBackoff(20, 1000, 60000)).toBe(60000);
  });
});

describe('CircuitBreaker', () => {
  it('opens after threshold failures', () => {
    const breaker = new CircuitBreaker(2, 10000);
    expect(breaker.canExecute()).toBe(true);

    breaker.recordFailure();
    breaker.recordFailure();

    expect(breaker.canExecute()).toBe(false);
  });

  it('resets after success', () => {
    const breaker = new CircuitBreaker(2, 10000);

    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.canExecute()).toBe(false);

    breaker.recordSuccess();
    expect(breaker.canExecute()).toBe(true);
  });
});
