# Operational Runbook: API Outage

## 1. Symptoms
- High rate of HTTP 5xx responses (502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout).
- Ingress/Load balancer health check failures on `/health` and `/health/live`.
- Student learning sessions fail to load or report connection errors.
- Teacher studio saving or publishing requests time out.

## 2. Detection
- Prometheus Alert: `ApiHigh5xxRate` (> 1% 5xx over 3 minutes).
- Prometheus Alert: `ApiInstanceUnhealthy` (Instances passing `/health/live` < required minimum).
- Load Balancer / CDN status dashboard shows elevated error rates.

## 3. Immediate Action
1. **Verify Process Status**:
   - Check if containers/instances are crash-looping:
     ```bash
     kubectl get pods -l app=youva-backend
     docker ps | grep youva-backend
     ```
2. **Inspect Readiness Probes**:
   - Query `/health/ready` to determine if failure is a process crash or dependency failure (DB/Redis).
3. **Rollback if Correlated with Deployment**:
   - If incident occurred within 15 minutes of a deployment:
     ```bash
     kubectl rollout undo deployment/youva-backend
     ```

## 4. Diagnosis
1. **Container Logs**:
   ```bash
   kubectl logs -l app=youva-backend --tail=200 --prefix
   ```
   Look for `FATAL`, unhandled exceptions, or out-of-memory (OOM) errors.
2. **Resource Exhaustion**:
   - Check container memory and CPU utilization:
     ```bash
     kubectl top pods -l app=youva-backend
     ```
3. **Database Connection Saturation**:
   - Check connection pool metrics (`db_connections`).

## 5. Recovery
1. **If OOMKilled**:
   - Temporarily increase memory limit in deployment specification.
   - Restart the deployment cleanly:
     ```bash
     kubectl rollout restart deployment/youva-backend
     ```
2. **If Cascading Failure from Downstream**:
   - Engage circuit breakers or scale API replicas to absorb burst traffic.

## 6. Post-Incident
- Conduct post-mortem review within 24 hours.
- Verify that canonical knowledge and evidence logs were not corrupted.
- Check outbox queue for any buffered events that need processing.
