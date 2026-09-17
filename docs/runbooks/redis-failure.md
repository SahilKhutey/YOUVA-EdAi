# Runbook: Redis Cache Cluster Failure & Graceful Degradation

## 1. Trigger Conditions
- `/health/dependencies` returns `redis: down`.
- Elevated latency on session lookups, rate limiting, or cached learning graph navigation.
- Redis socket connection timeouts (`ECONNREFUSED` or timeout after 500ms).

## 2. Severity Classification
- **SEV-2**: Redis cluster unavailable. System enters graceful degradation mode; authoritative data is read directly from PostgreSQL. Rate limiting falls back to in-memory local caches.

## 3. Invariants During Redis Outage
- **Learner Safety & Mastery Invariant**: Authoritative mastery state, student answers, and safety escalations are persisted directly to PostgreSQL. They NEVER depend solely on Redis.
- **Truthful Degradation**: Frontend displays connectivity and degradation indicators without disrupting student activities.

## 4. Diagnostics & Remediation
1. **Probe Redis Connectivity**:
   ```bash
   redis-cli -u $REDIS_URL ping
   ```
2. **Inspect Memory Pressure & Eviction Policy**:
   ```bash
   redis-cli info memory
   ```
3. **If Redis is Crashed or Unreachable**:
   - Restart Redis service or cluster node:
     ```bash
     docker restart youva-redis || systemctl restart redis-server
     ```
   - Flush corrupted temporary keys if node fails to start from appendonly.aof:
     ```bash
     redis-check-aof --fix /var/lib/redis/appendonly.aof
     ```
4. **Verification**:
   - Run synthetic probe:
     ```bash
     curl -X GET http://localhost:4000/api/synthetic/probe/SYN-003
     ```
   - Check application metrics for cache hit restoration:
     ```bash
     curl -s http://localhost:4000/api/observability/metrics | grep cache_
     ```
