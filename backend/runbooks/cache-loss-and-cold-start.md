# Operational Runbook: Cache Loss & Cold-Start Recovery

## 1. Symptoms
- Redis instance is unavailable, crashes, or is restarted with empty memory.
- Database query latency spikes temporarily as requests hit PostgreSQL directly instead of cache.
- `/health/ready` reports `redis.status: "down"`.

## 2. Detection
- Prometheus Alert: `RedisConnectionDown`.
- Prometheus Alert: `DbQueryVolumeSpike` (Cache miss rate increases to 100%).

## 3. Immediate Action
1. **Verify Automatic Fallback**:
   - Confirm that `LkcCacheService` automatically falls back to in-memory caching without crashing application instances.
   - Core learning invariant: Cache is derived, never authoritative. Database remains the single source of truth.
2. **Monitor Database Connection Pool**:
   - Ensure the temporary increase in direct DB queries does not exhaust the PostgreSQL connection pool.

## 4. Diagnosis
1. **Redis Pod / Server Status**:
   - Check if Redis process was OOM-killed (memory limit exceeded) or suffered disk persistence failure:
     ```bash
     kubectl describe pod -l app=youva-redis
     ```
2. **Key Expiration / Eviction Policy**:
   - Verify `maxmemory-policy` in Redis configuration (recommended: `volatile-lru` or `allkeys-lru`).

## 5. Recovery
1. **Restart / Restore Redis**:
   ```bash
   kubectl rollout restart deployment/youva-redis
   # or docker restart youva_redis
   ```
2. **Cold-Start Pre-Warming (Optional for High-Traffic Drops)**:
   - Run a warming script to preload published knowledge graph metadata:
     ```bash
     npm run cache:warm-published
     ```
3. **Natural Cache Repopulation**:
   - Normal application read traffic will automatically repopulate versioned keys:
     `tenant:{tenantId}:knowledge:{id}:published:v{version}`

## 6. Post-Incident
- Review Redis memory sizing and eviction alerts.
- Verify that cache hit rate returns to $> 85\%$ within 30 minutes of restore.
