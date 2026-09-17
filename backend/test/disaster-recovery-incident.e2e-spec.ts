import { DrVerificationService, BackupArtifact } from '../src/reliability/dr/dr-verification.service';
import { IncidentManagerService, IncidentState } from '../src/reliability/incident/incident-manager.service';
import { AlertManagerService } from '../src/reliability/incident/alert-manager.service';

describe('N7: Disaster Recovery & Incident Management (DR-001..DR-020 & INC-001..INC-015)', () => {
  let drService: DrVerificationService;
  let incidentManager: IncidentManagerService;
  let alertManager: AlertManagerService;

  beforeEach(() => {
    drService = new DrVerificationService();
    incidentManager = new IncidentManagerService();
    alertManager = new AlertManagerService();
  });

  afterEach(() => {
    incidentManager.reset();
    alertManager.clear();
  });

  describe('12-Point Disaster Recovery Drill (DR-001..DR-020)', () => {
    const validSampleData = {
      users: [
        { id: 'u1', email: 's1@youva.ai', role: 'STUDENT', tenantId: 't1' },
        { id: 'u2', email: 't1@youva.ai', role: 'TEACHER', tenantId: 't1' },
      ],
      userTopicMastery: [
        { id: 'm1', userId: 'u1', topicId: 'top1', masteryScore: 0.95 },
      ],
      safetyEscalations: [
        { id: 'sec1', studentId: 'u1', status: 'RESOLVED', severity: 'HIGH' },
      ],
      auditLogs: [
        { id: 'a1', previousHash: '0000', currentHash: 'abc1', timestamp: new Date().toISOString() },
        { id: 'a2', previousHash: 'abc1', currentHash: 'def2', timestamp: new Date().toISOString() },
      ],
    };

    it('DR-001: Run full 12-point DR drill successfully on valid backup', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const drill = await drService.runDrVerificationDrill(backup);
      expect(drill.allPassing).toBe(true);
      expect(drill.results.length).toBe(12);
      expect(drill.passedCount).toBe(12);
      expect(drill.failedCount).toBe(0);
    });

    it('DR-002: DR-001 checkpoint passes on backup artifact existence', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const res = await drService.runDrVerificationDrill(backup);
      const step = res.results.find((r) => r.stepId === 'DR-001');
      expect(step?.passed).toBe(true);
    });

    it('DR-003: DR-002 checkpoint verifies SHA-256 checksum integrity', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const res = await drService.runDrVerificationDrill(backup);
      const step = res.results.find((r) => r.stepId === 'DR-002');
      expect(step?.passed).toBe(true);
    });

    it('DR-004: DR-003 checkpoint verifies backup age is within 24h threshold', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const res = await drService.runDrVerificationDrill(backup);
      const step = res.results.find((r) => r.stepId === 'DR-003');
      expect(step?.passed).toBe(true);
    });

    it('DR-005: DR-004 checkpoint verifies schema compatibility', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const res = await drService.runDrVerificationDrill(backup);
      const step = res.results.find((r) => r.stepId === 'DR-004');
      expect(step?.passed).toBe(true);
    });

    it('DR-006: DR-005 checkpoint tests restore into isolated verification target', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const res = await drService.runDrVerificationDrill(backup);
      const step = res.results.find((r) => r.stepId === 'DR-005');
      expect(step?.passed).toBe(true);
    });

    it('DR-007: DR-006 checkpoint verifies row count consistency across tables', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const res = await drService.runDrVerificationDrill(backup);
      const step = res.results.find((r) => r.stepId === 'DR-006');
      expect(step?.passed).toBe(true);
    });

    it('DR-008: DR-007 checkpoint verifies RTO measurement is <= 15 minutes', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const res = await drService.runDrVerificationDrill(backup);
      const step = res.results.find((r) => r.stepId === 'DR-007');
      expect(step?.passed).toBe(true);
      expect(step?.message).toContain('RTO');
    });

    it('DR-009: DR-008 checkpoint verifies RPO window is <= 1 hour', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const res = await drService.runDrVerificationDrill(backup);
      const step = res.results.find((r) => r.stepId === 'DR-008');
      expect(step?.passed).toBe(true);
    });

    it('DR-010: DR-009 checkpoint guarantees learner mastery state conservation', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const res = await drService.runDrVerificationDrill(backup);
      const step = res.results.find((r) => r.stepId === 'DR-009');
      expect(step?.passed).toBe(true);
    });

    it('DR-011: DR-010 checkpoint verifies multi-tenant isolation partition invariance', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const res = await drService.runDrVerificationDrill(backup);
      const step = res.results.find((r) => r.stepId === 'DR-010');
      expect(step?.passed).toBe(true);
    });

    it('DR-012: DR-011 checkpoint ensures safety escalation records are fully preserved', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const res = await drService.runDrVerificationDrill(backup);
      const step = res.results.find((r) => r.stepId === 'DR-011');
      expect(step?.passed).toBe(true);
    });

    it('DR-013: DR-012 checkpoint validates cryptographic audit chain continuity', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const res = await drService.runDrVerificationDrill(backup);
      const step = res.results.find((r) => r.stepId === 'DR-012');
      expect(step?.passed).toBe(true);
    });

    it('DR-014: Tampered backup payload fails checksum verification (DR-002)', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const tampered: BackupArtifact = {
        ...backup,
        dataDump: backup.dataDump + 'tampered_data_added',
      };
      const drill = await drService.runDrVerificationDrill(tampered);
      const step2 = drill.results.find((r) => r.stepId === 'DR-002');
      expect(step2?.passed).toBe(false);
      expect(drill.allPassing).toBe(false);
    });

    it('DR-015: Stale backup older than 24 hours fails age validation (DR-003)', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const stale: BackupArtifact = {
        ...backup,
        createdAt: new Date(Date.now() - 36 * 3600 * 1000), // 36 hours old
      };
      const drill = await drService.runDrVerificationDrill(stale);
      const step3 = drill.results.find((r) => r.stepId === 'DR-003');
      expect(step3?.passed).toBe(false);
    });

    it('DR-016: Corrupted JSON dump triggers restore failure (DR-005)', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const corrupted: BackupArtifact = {
        ...backup,
        checksumSha256: 'fake',
        dataDump: '{ bad json',
      };
      const drill = await drService.runDrVerificationDrill(corrupted);
      const step5 = drill.results.find((r) => r.stepId === 'DR-005');
      expect(step5?.passed).toBe(false);
    });

    it('DR-017: Empty backup fails table row count consistency (DR-006)', async () => {
      const emptyBackup = drService.createBackupSnapshot({});
      const drill = await drService.runDrVerificationDrill(emptyBackup);
      const step6 = drill.results.find((r) => r.stepId === 'DR-006');
      expect(step6?.passed).toBe(false);
    });

    it('DR-018: Backup snapshot contains valid metadata and sizeBytes', () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      expect(backup.backupId).toContain('DR-SNAP');
      expect(backup.sizeBytes).toBeGreaterThan(50);
      expect(backup.tableCounts.users).toBe(2);
    });

    it('DR-019: Broken audit chain fails DR-012 continuity validation', async () => {
      const brokenAuditData = {
        ...validSampleData,
        auditLogs: [
          { id: 'a1', previousHash: '0000', currentHash: 'hashA' },
          { id: 'a2', previousHash: 'mismatchedHash', currentHash: 'hashB' },
        ],
      };
      const backup = drService.createBackupSnapshot(brokenAuditData);
      const drill = await drService.runDrVerificationDrill(backup);
      const step12 = drill.results.find((r) => r.stepId === 'DR-012');
      expect(step12?.passed).toBe(false);
    });

    it('DR-020: Disaster recovery drill returns execution duration in milliseconds', async () => {
      const backup = drService.createBackupSnapshot(validSampleData);
      const drill = await drService.runDrVerificationDrill(backup);
      expect(drill.totalDurationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Formal Incident Lifecycle Management (INC-001..INC-015)', () => {
    it('INC-001: Incident declaration creates valid record with SEV-0 severity', () => {
      const inc = incidentManager.declareIncident({
        title: 'Total PostgreSQL Primary Outage',
        description: 'Connection pool exhausted, health check failing.',
        severity: 'SEV-0',
        actor: 'oncall-sre',
      });
      expect(inc.id).toBeDefined();
      expect(inc.title).toBe('Total PostgreSQL Primary Outage');
      expect(inc.severity).toBe('SEV-0');
      expect(inc.state).toBe(IncidentState.DETECTED);
      expect(inc.timeline.length).toBe(1);
    });

    it('INC-002: Initial incident state is DETECTED', () => {
      const inc = incidentManager.declareIncident({
        title: 'Redis Outage',
        description: 'Redis pod restarted',
        severity: 'SEV-2',
      });
      expect(inc.state).toBe(IncidentState.DETECTED);
    });

    it('INC-003: State transition DETECTED -> TRIAGED', () => {
      const inc = incidentManager.declareIncident({
        title: 'Outbox backlog high',
        description: 'Queue length > 5000',
        severity: 'SEV-1',
      });
      const updated = incidentManager.transitionState(inc.id, IncidentState.TRIAGED, 'Acknowledged by ops', 'operator1');
      expect(updated.state).toBe(IncidentState.TRIAGED);
    });

    it('INC-004: State transition TRIAGED -> CONTAINED', () => {
      const inc = incidentManager.declareIncident({
        title: 'High 500 rate',
        description: 'Upstream provider 500',
        severity: 'SEV-1',
      });
      incidentManager.transitionState(inc.id, IncidentState.TRIAGED, 'Triaged', 'ops');
      const updated = incidentManager.transitionState(inc.id, IncidentState.CONTAINED, 'Circuit breaker tripped', 'ops');
      expect(updated.state).toBe(IncidentState.CONTAINED);
    });

    it('INC-005: State transition CONTAINED -> MITIGATED', () => {
      const inc = incidentManager.declareIncident({ title: 'T', description: 'D', severity: 'SEV-2' });
      incidentManager.transitionState(inc.id, IncidentState.TRIAGED, 'T', 'ops');
      incidentManager.transitionState(inc.id, IncidentState.CONTAINED, 'C', 'ops');
      const updated = incidentManager.transitionState(inc.id, IncidentState.MITIGATED, 'Fallback active', 'ops');
      expect(updated.state).toBe(IncidentState.MITIGATED);
    });

    it('INC-006: State transition MITIGATED -> RECOVERED', () => {
      const inc = incidentManager.declareIncident({ title: 'T', description: 'D', severity: 'SEV-2' });
      incidentManager.transitionState(inc.id, IncidentState.TRIAGED, 'T', 'ops');
      incidentManager.transitionState(inc.id, IncidentState.CONTAINED, 'C', 'ops');
      incidentManager.transitionState(inc.id, IncidentState.MITIGATED, 'M', 'ops');
      const updated = incidentManager.transitionState(inc.id, IncidentState.RECOVERED, 'Primary online', 'ops');
      expect(updated.state).toBe(IncidentState.RECOVERED);
    });

    it('INC-007: State transition RECOVERED -> VERIFIED', () => {
      const inc = incidentManager.declareIncident({ title: 'T', description: 'D', severity: 'SEV-2' });
      incidentManager.transitionState(inc.id, IncidentState.TRIAGED, 'T', 'ops');
      incidentManager.transitionState(inc.id, IncidentState.CONTAINED, 'C', 'ops');
      incidentManager.transitionState(inc.id, IncidentState.MITIGATED, 'M', 'ops');
      incidentManager.transitionState(inc.id, IncidentState.RECOVERED, 'R', 'ops');
      const updated = incidentManager.transitionState(inc.id, IncidentState.VERIFIED, 'Probes passing', 'ops');
      expect(updated.state).toBe(IncidentState.VERIFIED);
    });

    it('INC-008: State transition VERIFIED -> CLOSED', () => {
      const inc = incidentManager.declareIncident({ title: 'T', description: 'D', severity: 'SEV-3' });
      incidentManager.transitionState(inc.id, IncidentState.TRIAGED, 'T', 'ops');
      incidentManager.transitionState(inc.id, IncidentState.CONTAINED, 'C', 'ops');
      incidentManager.transitionState(inc.id, IncidentState.MITIGATED, 'M', 'ops');
      incidentManager.transitionState(inc.id, IncidentState.RECOVERED, 'R', 'ops');
      incidentManager.transitionState(inc.id, IncidentState.VERIFIED, 'V', 'ops');
      const updated = incidentManager.transitionState(inc.id, IncidentState.CLOSED, 'Incident resolved', 'ops');
      expect(updated.state).toBe(IncidentState.CLOSED);
      expect(updated.resolvedAt).toBeDefined();
    });

    it('INC-009: State transition CLOSED -> POSTMORTEM', () => {
      const inc = incidentManager.declareIncident({ title: 'T', description: 'D', severity: 'SEV-1' });
      incidentManager.transitionState(inc.id, IncidentState.CLOSED, 'Fast close', 'ops');
      const updated = incidentManager.transitionState(inc.id, IncidentState.POSTMORTEM, 'Starting postmortem', 'ops');
      expect(updated.state).toBe(IncidentState.POSTMORTEM);
    });

    it('INC-010: Illegal state transition throws error', () => {
      const inc = incidentManager.declareIncident({ title: 'T', description: 'D', severity: 'SEV-1' });
      expect(() => {
        incidentManager.transitionState(inc.id, IncidentState.VERIFIED, 'Skip steps', 'ops');
      }).toThrow('Invalid incident lifecycle transition');
    });

    it('INC-011: Incident timeline preserves entire chronological history', () => {
      const inc = incidentManager.declareIncident({ title: 'T', description: 'D', severity: 'SEV-2', actor: 'bot' });
      incidentManager.transitionState(inc.id, IncidentState.TRIAGED, 'Assigned to Alice', 'Alice');
      incidentManager.transitionState(inc.id, IncidentState.CLOSED, 'Resolved', 'Alice');

      const full = incidentManager.getIncident(inc.id);
      expect(full?.timeline.length).toBe(3);
      expect(full?.timeline[0].actor).toBe('bot');
      expect(full?.timeline[1].actor).toBe('Alice');
      expect(full?.timeline[2].note).toBe('Resolved');
    });

    it('INC-012: AlertManager creates and tracks active alerts', () => {
      const alert = alertManager.triggerAlert({
        ruleId: 'HIGH_LATENCY',
        severity: 'HIGH',
        message: 'p95 latency > 1000ms',
        source: 'MetricsService',
      });
      expect(alert.id).toBeDefined();
      expect(alertManager.getActiveAlerts().length).toBe(1);
    });

    it('INC-013: AlertManager suppresses duplicate alerts within suppression window', () => {
      alertManager.triggerAlert({
        ruleId: 'HIGH_ERROR_RATE',
        severity: 'CRITICAL',
        message: '500 error rate > 5%',
        source: 'SloTracker',
      });

      // Second trigger of the same ruleId within default 5min window is deduplicated
      const dup = alertManager.triggerAlert({
        ruleId: 'HIGH_ERROR_RATE',
        severity: 'CRITICAL',
        message: '500 error rate > 5%',
        source: 'SloTracker',
      });

      expect(dup.occurrences).toBe(2);
      expect(alertManager.getActiveAlerts().length).toBe(1);
    });

    it('INC-014: AlertManager resolves alerts', () => {
      const alert = alertManager.triggerAlert({
        ruleId: 'DB_DOWN',
        severity: 'CRITICAL',
        message: 'Postgres unreachable',
        source: 'HealthService',
      });
      const resolved = alertManager.resolveAlert(alert.id, 'Postgres back online');
      expect(resolved?.resolved).toBe(true);
      expect(alertManager.getActiveAlerts().length).toBe(0);
    });

    it('INC-015: Attaching postmortem documents root cause and action items', () => {
      const inc = incidentManager.declareIncident({ title: 'T', description: 'D', severity: 'SEV-1' });
      incidentManager.transitionState(inc.id, IncidentState.CLOSED, 'Resolved', 'ops');
      const pm = {
        rootCause: 'Connection pool deadlock under sudden spike',
        impactSummary: '35 learners received retry prompts over 4 minutes',
        actionItems: ['Increase PgBouncer pool ceiling', 'Add keepalive probe'],
        preventiveMeasures: ['Implement predictive autoscale'],
      };
      const updated = incidentManager.attachPostmortem(inc.id, pm);
      expect(updated.state).toBe(IncidentState.POSTMORTEM);
      expect(updated.postmortem?.actionItems.length).toBe(2);
    });
  });
});
