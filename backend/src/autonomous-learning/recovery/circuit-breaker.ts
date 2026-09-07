export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;

  constructor(
    private readonly threshold = 5,
    private readonly cooldownMs = 30000,
  ) {}

  canExecute(): boolean {
    if (this.failures < this.threshold) {
      return true;
    }

    return Date.now() - this.openedAt >= this.cooldownMs;
  }

  recordSuccess() {
    this.failures = 0;
    this.openedAt = 0;
  }

  recordFailure() {
    this.failures += 1;

    if (this.failures >= this.threshold) {
      this.openedAt = Date.now();
    }
  }
}
