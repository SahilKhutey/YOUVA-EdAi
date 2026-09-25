import { ReconciliationService } from '../services/reconciliation.service';
import { RepairService } from '../services/repair.service';
import { RepairPolicy } from '../policies/repair-policy';

describe('Reconciliation & Safe Repair (LKC-14)', () => {
  let reconService: ReconciliationService;
  let repairService: RepairService;
  let repairPolicy: RepairPolicy;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {};
    repairPolicy = new RepairPolicy();
    repairService = new RepairService(repairPolicy);
    reconService = new ReconciliationService(mockPrisma);
  });

  describe('ReconciliationService', () => {
    it('should detect search index mismatch and suggest REINDEX_SEARCH repair', async () => {
      const report = await reconService.reconcileKnowledge('tenant-1');
      expect(report.target).toBe('KNOWLEDGE');
      expect(report.status).toBe('MISMATCH_DETECTED');
      expect(report.mismatchesFound).toBe(1);
      expect(report.suggestedRepair).toBe('REINDEX_SEARCH');
    });

    it('should verify event delivery outbox consistency', async () => {
      const report = await reconService.reconcileEvents('tenant-1');
      expect(report.target).toBe('EVENTS');
      expect(report.status).toBe('CONSISTENT');
      expect(report.mismatchesFound).toBe(0);
    });
  });

  describe('RepairPolicy & RepairService', () => {
    it('should allow autonomous execution for safe derived data repairs', async () => {
      const evalResult = repairPolicy.evaluateRepairPermission('REINDEX_SEARCH', 'SEARCH_INDEX');
      expect(evalResult.allowed).toBe(true);
      expect(evalResult.permission).toBe('AUTO_REPAIR');

      const repairRes = await repairService.executeRepair({
        repairAction: 'REINDEX_SEARCH',
        targetType: 'SEARCH_INDEX',
        targetId: 'know_idx',
        reason: 'Fix index desync',
        actor: 'Admin',
      });

      expect(repairRes.permission).toBe('AUTO_REPAIR');
      expect(repairRes.status).toBe('COMPLETED');
    });

    it('should require human approval for pedagogical modifications', async () => {
      const evalResult = repairPolicy.evaluateRepairPermission('MANUAL_PEDAGOGICAL_FIX', 'KNOWLEDGE_OBJECT');
      expect(evalResult.allowed).toBe(false);
      expect(evalResult.permission).toBe('HUMAN_APPROVAL');

      const repairRes = await repairService.executeRepair({
        repairAction: 'MANUAL_PEDAGOGICAL_FIX',
        targetType: 'KNOWLEDGE_OBJECT',
        targetId: 'obj-1',
        reason: 'Update content',
        actor: 'Admin',
      });

      expect(repairRes.status).toBe('QUEUED');
      expect(repairRes.permission).toBe('HUMAN_APPROVAL');
    });

    it('should strictly block prohibited mutations on security boundaries and historical evidence', async () => {
      const evalResult = repairPolicy.evaluateRepairPermission('CROSS_TENANT_MUTATION', 'TENANT');
      expect(evalResult.allowed).toBe(false);
      expect(evalResult.permission).toBe('BLOCKED');

      const repairRes = await repairService.executeRepair({
        repairAction: 'CROSS_TENANT_MUTATION',
        targetType: 'TENANT',
        targetId: 'tenant-1',
        reason: 'Override tenant',
        actor: 'Admin',
      });

      expect(repairRes.status).toBe('BLOCKED');
      expect(repairRes.permission).toBe('BLOCKED');
    });
  });
});
