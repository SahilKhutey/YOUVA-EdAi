describe('General Unit Tests: Transactional Outbox Pattern (UT-GEN-052 - UT-GEN-056)', () => {
  type OutboxStatus = 'PENDING' | 'PUBLISHED' | 'FAILED' | 'DEAD_LETTER';

  interface OutboxRecord {
    id: string;
    eventType: string;
    payload: string;
    status: OutboxStatus;
    retryCount: number;
    maxRetries: number;
    lastError?: string;
  }

  class MockOutboxService {
    private records = new Map<string, OutboxRecord>();

    persistWithTransaction(id: string, eventType: string, payload: any, maxRetries = 3): OutboxRecord {
      if (this.records.has(id)) {
        throw new Error(`DuplicateOutboxEventError: Event "${id}" already exists in outbox`);
      }
      const record: OutboxRecord = {
        id,
        eventType,
        payload: JSON.stringify(payload),
        status: 'PENDING',
        retryCount: 0,
        maxRetries,
      };
      this.records.set(id, record);
      return record;
    }

    async processRecord(id: string, publishFn: (record: OutboxRecord) => Promise<boolean>): Promise<OutboxRecord> {
      const record = this.records.get(id);
      if (!record) throw new Error('Outbox record not found');

      try {
        const success = await publishFn(record);
        if (success) {
          record.status = 'PUBLISHED';
          return record;
        }
      } catch (err: any) {
        record.retryCount++;
        record.lastError = err.message;
        if (record.retryCount >= record.maxRetries) {
          record.status = 'DEAD_LETTER';
        } else {
          record.status = 'FAILED';
        }
      }
      return record;
    }

    getRecord(id: string) {
      return this.records.get(id);
    }
  }

  describe('UT-GEN-052: Outbox - Event persisted with transaction', () => {
    it('persists event in PENDING state alongside domain mutation', () => {
      const outbox = new MockOutboxService();
      const record = outbox.persistWithTransaction('evt-out-1', 'credential.issued', { credentialId: 'c1' });
      expect(record.status).toBe('PENDING');
      expect(record.retryCount).toBe(0);
    });
  });

  describe('UT-GEN-053: Outbox - Duplicate event prevented', () => {
    it('rejects insertion of identical outbox event ID', () => {
      const outbox = new MockOutboxService();
      outbox.persistWithTransaction('evt-out-dup', 'lesson.started', {});
      expect(() => outbox.persistWithTransaction('evt-out-dup', 'lesson.started', {})).toThrow('DuplicateOutboxEventError');
    });
  });

  describe('UT-GEN-054: Outbox - Failed event can retry', () => {
    it('increments retry counter and sets status to FAILED when transient error occurs', async () => {
      const outbox = new MockOutboxService();
      outbox.persistWithTransaction('evt-out-2', 'email.send', {}, 3);

      const updated = await outbox.processRecord('evt-out-2', async () => {
        throw new Error('SMTP timeout');
      });

      expect(updated.status).toBe('FAILED');
      expect(updated.retryCount).toBe(1);
      expect(updated.lastError).toBe('SMTP timeout');
    });
  });

  describe('UT-GEN-055: Outbox - Retry limit enforced', () => {
    it('stops retrying when maximum retry count is reached', async () => {
      const outbox = new MockOutboxService();
      outbox.persistWithTransaction('evt-out-3', 'sms.send', {}, 2);

      // Attempt 1
      await outbox.processRecord('evt-out-3', async () => { throw new Error('Carrier down'); });
      expect(outbox.getRecord('evt-out-3')?.retryCount).toBe(1);

      // Attempt 2 (exhausts maxRetries = 2)
      await outbox.processRecord('evt-out-3', async () => { throw new Error('Carrier down'); });
      expect(outbox.getRecord('evt-out-3')?.retryCount).toBe(2);
    });
  });

  describe('UT-GEN-056: Outbox - Dead-letter state reached after exhaustion', () => {
    it('transitions outbox record into DEAD_LETTER state when retries are exhausted', async () => {
      const outbox = new MockOutboxService();
      outbox.persistWithTransaction('evt-out-dead', 'payment.settle', {}, 2);

      await outbox.processRecord('evt-out-dead', async () => { throw new Error('Unrecoverable gateway 400'); });
      const final = await outbox.processRecord('evt-out-dead', async () => { throw new Error('Unrecoverable gateway 400'); });

      expect(final.status).toBe('DEAD_LETTER');
    });
  });
});
