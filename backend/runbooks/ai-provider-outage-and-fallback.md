# Operational Runbook: AI Provider Outage & Graceful Degradation

## 1. Symptoms
- External AI provider (Google Gemini / OpenAI) returns HTTP 429 (Rate Limit), 503 (Unavailable), or timeouts.
- Circuit breaker for AI provider transitions to `OPEN`.
- AI assistance features (question generation, hints, explanations) return deterministic fallback responses or cached answers.
- Core student learning and teacher editing continue operating normally.

## 2. Detection
- Prometheus Alert: `AiCircuitBreakerOpen` (`circuit_breakers_open > 0` for `gemini` or `ai_gateway`).
- Prometheus Alert: `AiHighErrorRate` (`ai_failures / ai_requests > 0.15`).
- Operations Dashboard shows `AI Gateway: Degraded` or `Kill Switch Active`.

## 3. Immediate Action
1. **Verify Circuit Breaker Status**:
   - Query `/reliability/circuit-breakers` to check if circuit is in `OPEN` or `HALF_OPEN` state.
2. **Verify Pedagogical Degradation**:
   - Confirm that student practice and canonical knowledge delivery are NOT blocked.
   - Core learning invariant: AI is an enhancement; student progress is never gated on AI availability.
3. **Engage Kill Switch (If cascading timeouts occur)**:
   - If provider failure causes HTTP connection hanging, engage the Global AI Kill Switch via `ProductionOperationsDashboard` to immediately bypass external calls.

## 4. Diagnosis
1. **Provider Status Page**:
   - Check Google Cloud Status / OpenAI status for widespread outages.
2. **Quota / Billing**:
   - Check if monthly budget cap or rate limit per minute was exceeded.
3. **Model Deprecation / API Change**:
   - Check if provider deprecated the configured model name.

## 5. Recovery
1. **Switch AI Provider / Model**:
   - Update `AI_PROVIDER` or `AI_MODEL` environment variable to a secondary provider or smaller model.
2. **Circuit Auto-Recovery**:
   - The circuit breaker will automatically enter `HALF_OPEN` after the cooldown period (default 10s).
   - Once successful responses return, the circuit returns to `CLOSED`.
3. **Reset Circuit Manually** (if desired after provider fix):
   - Call `/reliability/circuit-breakers/reset` or restart the service.

## 6. Post-Incident
- Review AI provider SLA and cost tracking.
- Verify that AI provenance records logged the failure and fallback status without corrupting learner state.
