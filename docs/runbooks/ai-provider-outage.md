# Runbook: AI Provider Outage, Rate Limit Exhaustion & Deterministic Fallback

## 1. Trigger Conditions
- High rate of upstream AI provider failures (Gemini / Claude / OpenAI returning 429, 500, or 503).
- Elevated circuit breaker trips on `CircuitBreakerService` (`ai_provider_failures` counter spike).
- Latency percentiles (`ai_latency_ms_p95`) exceeding 5000ms.

## 2. Severity Classification
- **SEV-1**: Primary external AI provider down; automatic fallback to deterministic pedagogical models activated.
- **SEV-2**: Single tenant rate-limit quota exhausted or soft spend ceiling breached.

## 3. Invariant Guarantees
- **Pedagogical Continuity**: When external models fail, `AiGatewayService` falls back to deterministic curriculum hints and templates.
- **Audit Preservation**: Every provider attempt, fallback execution, and error code is logged with HMAC-chained audit records.
- **No Consequential Decision Bypass**: AI failures NEVER allow autonomous graduation or safety escalation closures.

## 4. Operational Actions
1. **Check AI Gateway Circuit Status**:
   ```bash
   curl -s http://localhost:4000/api/observability/snapshot | grep -A 10 "circuitBreakers"
   ```
2. **Review Model Router Health & Failures**:
   ```bash
   curl -s http://localhost:4000/api/observability/metrics | grep ai_
   ```
3. **Emergency Provider Shift / Degradation**:
   - Set environment variable to force fallback or alternate model:
     ```bash
     export AI_PRIMARY_PROVIDER=deterministic
     ```
   - Or adjust tenant rate limits in FinOps dashboard if quota exceeded.
4. **Verification**:
   - Run AI probe:
     ```bash
     curl -X GET http://localhost:4000/api/synthetic/probe/SYN-010
     ```
