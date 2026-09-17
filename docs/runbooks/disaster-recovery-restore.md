# Runbook: Disaster Recovery, Point-in-Time Restore & 12-Point Drill

## 1. Disaster Recovery Objectives
- **Recovery Time Objective (RTO)**: $\le 15$ minutes (system back online serving core learning pathways).
- **Recovery Point Objective (RPO)**: $\le 1$ hour (maximum allowable data loss from WAL/PITR snapshots).
- **Zero Silent Data Loss**: All recovered state must pass the 12-point integrity check (`DR-001` through `DR-012`).

## 2. Trigger Conditions
- Catastrophic data center outage or regional cloud failure.
- Ransomware / irreversible database corruption.
- SEV-0 incident declaration requiring cold site failover.

## 3. Disaster Recovery Execution Procedure
### Step 1: Declare DR & Freeze Ingress
1. Point DNS / Cloudflare away from damaged region to static maintenance page:
   ```bash
   cloudflare-cli set-dns-failover --zone youva.ai --target maintenance.youva.ai
   ```
2. Halt any surviving workers to prevent partial write divergence.

### Step 2: Restore from Immutable Backup / Snapshot
1. Retrieve latest encrypted full snapshot from isolated secondary cloud storage (e.g., S3 Glacier / GCS coldline).
2. Validate archive checksum against signed backup manifest:
   ```bash
   sha256sum -c backup_manifest.sha256
   ```
3. Decrypt and restore PostgreSQL cluster using pg_restore / WAL-E / Barman:
   ```bash
   pg_restore --clean --if-exists -h dr-postgres-instance -U postgres -d youva_edai latest_backup.dump
   ```
4. Replay WAL archives up to designated Point-In-Time recovery target (PITR):
   ```sql
   -- recovery.signal
   restore_command = 'cp /mnt/wal_archive/%f %p'
   recovery_target_time = '2026-09-17 14:00:00 UTC'
   ```

### Step 3: Run 12-Point Automated Verification Drill
Execute the automated DR verification suite before opening ingress:
```bash
curl -X POST http://dr-api.internal:4000/api/dr/verify-all
```
Verification checkpoints:
- `DR-001`: Backup existence check
- `DR-002`: Checksum & integrity validation
- `DR-003`: Backup age ($\le 24$h full, $\le 1$h WAL)
- `DR-004`: Schema compatibility & migration version check
- `DR-005`: Restore drill into isolated verification schema
- `DR-006`: Row count consistency across core models
- `DR-007`: RTO measurement ($\le 15$m)
- `DR-008`: RPO validation ($\le 1$h)
- `DR-009`: Learner mastery state conservation
- `DR-010`: Tenant isolation partition invariance
- `DR-011`: Safety escalation queue restoration
- `DR-012`: Audit log cryptographic chain continuity

### Step 4: Cutover & Ingress Re-Enable
1. Verify synthetic monitoring suite passes:
   ```bash
   curl -X GET http://dr-api.internal:4000/api/synthetic/run
   ```
2. Update DNS routing to the DR cluster.
3. Remove maintenance page.
4. Notify institution stakeholders of successful recovery.
