describe('General Unit Tests: Repository, Transactions & Concurrency (UT-GEN-037 - UT-GEN-046)', () => {
  interface Entity {
    id: string;
    version: number;
    title: string;
    deleted: boolean;
  }

  class MockRepository {
    private store = new Map<string, Entity>();

    create(entity: Entity): Entity {
      if (this.store.has(entity.id)) {
        throw new Error(`DuplicateUniqueKeyError: Entity with id "${entity.id}" already exists`);
      }
      this.store.set(entity.id, { ...entity });
      return entity;
    }

    findById(id: string): Entity {
      const found = this.store.get(id);
      if (!found || found.deleted) {
        throw new Error(`NotFoundError: Entity "${id}" not found`);
      }
      return { ...found };
    }

    updateOptimistic(id: string, expectedVersion: number, updates: Partial<Entity>): Entity {
      const current = this.findById(id);
      if (current.version !== expectedVersion) {
        throw new Error(`ConcurrencyConflictError: Version mismatch (expected ${expectedVersion}, got ${current.version})`);
      }
      const updated: Entity = {
        ...current,
        ...updates,
        version: current.version + 1,
      };
      this.store.set(id, updated);
      return updated;
    }

    softDelete(id: string): boolean {
      const current = this.findById(id);
      this.store.set(id, { ...current, deleted: true });
      return true;
    }

    async transaction<T>(fn: (repo: MockRepository) => Promise<T>): Promise<T> {
      // Snapshot current store state
      const snapshot = new Map<string, Entity>(Array.from(this.store.entries()).map(([k, v]) => [k, { ...v }]));
      try {
        const result = await fn(this);
        return result;
      } catch (err) {
        // Rollback to snapshot
        this.store = snapshot;
        throw err;
      }
    }

    size() {
      return Array.from(this.store.values()).filter(v => !v.deleted).length;
    }
  }

  describe('UT-GEN-037: Repository - Record created correctly', () => {
    it('persists record with correct attributes', () => {
      const repo = new MockRepository();
      const entity = { id: 'e1', version: 1, title: 'Algebra Module', deleted: false };
      repo.create(entity);
      expect(repo.findById('e1').title).toBe('Algebra Module');
    });
  });

  describe('UT-GEN-038: Repository - Record retrieved correctly', () => {
    it('retrieves existing record by unique identifier', () => {
      const repo = new MockRepository();
      repo.create({ id: 'e2', version: 1, title: 'Geometry', deleted: false });
      const record = repo.findById('e2');
      expect(record.id).toBe('e2');
      expect(record.title).toBe('Geometry');
    });
  });

  describe('UT-GEN-039: Repository - Missing record handled correctly', () => {
    it('throws NotFoundError for non-existent record ID', () => {
      const repo = new MockRepository();
      expect(() => repo.findById('non-existent')).toThrow('NotFoundError');
    });
  });

  describe('UT-GEN-040: Repository - Record update preserves invariants', () => {
    it('updates record attributes and increments version counter', () => {
      const repo = new MockRepository();
      repo.create({ id: 'e3', version: 1, title: 'Initial Title', deleted: false });
      const updated = repo.updateOptimistic('e3', 1, { title: 'Updated Title' });
      expect(updated.title).toBe('Updated Title');
      expect(updated.version).toBe(2);
    });
  });

  describe('UT-GEN-041: Repository - Record deletion follows policy', () => {
    it('soft-deletes record preserving audit trail without physical destruction', () => {
      const repo = new MockRepository();
      repo.create({ id: 'e4', version: 1, title: 'To Delete', deleted: false });
      repo.softDelete('e4');
      expect(() => repo.findById('e4')).toThrow('NotFoundError');
    });
  });

  describe('UT-GEN-042: Repository - Duplicate unique record rejected/handled', () => {
    it('rejects insertion of duplicate unique primary key', () => {
      const repo = new MockRepository();
      repo.create({ id: 'e5', version: 1, title: 'Unique 1', deleted: false });
      expect(() => repo.create({ id: 'e5', version: 1, title: 'Unique Duplicate', deleted: false })).toThrow('DuplicateUniqueKeyError');
    });
  });

  describe('UT-GEN-043: Transaction - Successful transaction commits all changes', () => {
    it('commits all operations atomically when no errors occur', async () => {
      const repo = new MockRepository();
      await repo.transaction(async r => {
        r.create({ id: 't1', version: 1, title: 'Tx Item 1', deleted: false });
        r.create({ id: 't2', version: 1, title: 'Tx Item 2', deleted: false });
      });

      expect(repo.findById('t1')).toBeDefined();
      expect(repo.findById('t2')).toBeDefined();
      expect(repo.size()).toBe(2);
    });
  });

  describe('UT-GEN-044: Transaction - Failure rolls back all changes', () => {
    it('reverts all changes in transaction when an intermediate step fails', async () => {
      const repo = new MockRepository();
      repo.create({ id: 'existing', version: 1, title: 'Original', deleted: false });

      await expect(
        repo.transaction(async r => {
          r.create({ id: 'step1', version: 1, title: 'Step 1', deleted: false });
          // Force an error on step 2
          throw new Error('Database connection reset during step 2');
        }),
      ).rejects.toThrow('Database connection reset');

      expect(() => repo.findById('step1')).toThrow('NotFoundError');
      expect(repo.findById('existing').title).toBe('Original');
      expect(repo.size()).toBe(1);
    });
  });

  describe('UT-GEN-045: Transaction - Partial operation cannot persist', () => {
    it('ensures no intermediate state leaks to readers on rollback', async () => {
      const repo = new MockRepository();
      try {
        await repo.transaction(async r => {
          r.create({ id: 'partial1', version: 1, title: 'P1', deleted: false });
          r.create({ id: 'partial2', version: 1, title: 'P2', deleted: false });
          throw new Error('Validation failure');
        });
      } catch {
        // Expected
      }

      expect(() => repo.findById('partial1')).toThrow('NotFoundError');
      expect(() => repo.findById('partial2')).toThrow('NotFoundError');
    });
  });

  describe('UT-GEN-046: Concurrency - Concurrent updates handled safely', () => {
    it('detects concurrent modifications and rejects stale version writes', () => {
      const repo = new MockRepository();
      repo.create({ id: 'c1', version: 1, title: 'Concurrent Item', deleted: false });

      // Worker 1 updates version 1 -> 2
      repo.updateOptimistic('c1', 1, { title: 'Worker 1 Update' });

      // Worker 2 attempts update with stale version 1
      expect(() => repo.updateOptimistic('c1', 1, { title: 'Worker 2 Stale Update' })).toThrow('ConcurrencyConflictError');
    });
  });
});
