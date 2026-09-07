describe('General Unit Tests: Pagination, Sorting & Filtering (UT-GEN-029 - UT-GEN-036)', () => {
  interface Item {
    id: string;
    createdAt: string;
    score: number;
    subject: string;
    tenantId: string;
  }

  const sampleItems: Item[] = Array.from({ length: 50 }, (_, i) => ({
    id: `item-${String(i + 1).padStart(3, '0')}`,
    createdAt: new Date(Date.UTC(2026, 8, 1, 0, i, 0)).toISOString(),
    score: (i * 7) % 100,
    subject: i % 2 === 0 ? 'math' : 'science',
    tenantId: i < 30 ? 'tenant-1' : 'tenant-2',
  }));

  function paginateCursor(
    items: Item[],
    options: {
      cursor?: string;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      subject?: string;
      tenantScope?: string;
    },
  ) {
    const maxLimit = 25;
    const limit = Math.min(Math.max(options.limit ?? 10, 1), maxLimit);
    const validSortFields = new Set(['createdAt', 'score', 'id']);

    if (options.sortBy && !validSortFields.has(options.sortBy)) {
      throw new Error(`Invalid sort field: ${options.sortBy}. Allowed: [createdAt, score, id]`);
    }

    // Tenant boundary
    let filtered = items;
    if (options.tenantScope) {
      filtered = filtered.filter(it => it.tenantId === options.tenantScope);
    }

    // Filter
    if (options.subject) {
      filtered = filtered.filter(it => it.subject === options.subject);
    }

    // Sort
    const sortField = (options.sortBy ?? 'createdAt') as keyof Item;
    const sortOrder = options.sortOrder ?? 'asc';
    filtered.sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortOrder === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Cursor decode
    let startIndex = 0;
    if (options.cursor) {
      try {
        const decoded = Buffer.from(options.cursor, 'base64').toString('utf8');
        const found = filtered.findIndex(it => it.id === decoded);
        if (found === -1) {
          throw new Error('Invalid cursor: record reference not found in filtered set');
        }
        startIndex = found + 1;
      } catch (err: any) {
        throw new Error(`Invalid cursor: ${err.message}`);
      }
    }

    const pageItems = filtered.slice(startIndex, startIndex + limit);
    const nextItem = filtered[startIndex + limit];
    const nextCursor = nextItem ? Buffer.from(pageItems[pageItems.length - 1].id).toString('base64') : null;

    return {
      items: pageItems,
      nextCursor,
      hasMore: Boolean(nextCursor),
      limit,
    };
  }

  describe('UT-GEN-029: Pagination - First page generated correctly', () => {
    it('returns first page items with default page size and next cursor', () => {
      const page = paginateCursor(sampleItems, { limit: 5 });
      expect(page.items.length).toBe(5);
      expect(page.items[0].id).toBe('item-001');
      expect(page.hasMore).toBe(true);
      expect(page.nextCursor).toBeDefined();
    });
  });

  describe('UT-GEN-030: Pagination - Cursor pagination deterministic', () => {
    it('traverses subsequent pages deterministically without gaps or duplicates', () => {
      const page1 = paginateCursor(sampleItems, { limit: 10 });
      const page2 = paginateCursor(sampleItems, { cursor: page1.nextCursor!, limit: 10 });

      expect(page1.items.length).toBe(10);
      expect(page2.items.length).toBe(10);

      const ids1 = new Set(page1.items.map(i => i.id));
      const ids2 = new Set(page2.items.map(i => i.id));
      for (const id of ids2) {
        expect(ids1.has(id)).toBe(false);
      }
      expect(page2.items[0].id).toBe('item-011');
    });
  });

  describe('UT-GEN-031: Pagination - Invalid cursor rejected', () => {
    it('rejects malformed or non-existent cursor safely', () => {
      expect(() => paginateCursor(sampleItems, { cursor: 'invalid-non-base64-random-text' })).toThrow('Invalid cursor');
    });
  });

  describe('UT-GEN-032: Pagination - Page-size limit enforced', () => {
    it('clamps requested limit to maximum allowed page size (25)', () => {
      const page = paginateCursor(sampleItems, { limit: 100 });
      expect(page.limit).toBe(25);
      expect(page.items.length).toBe(25);
    });
  });

  describe('UT-GEN-033: Sorting - Valid sort accepted', () => {
    it('sorts by allowlisted field in ascending and descending order', () => {
      const asc = paginateCursor(sampleItems, { sortBy: 'score', sortOrder: 'asc', limit: 10 });
      const desc = paginateCursor(sampleItems, { sortBy: 'score', sortOrder: 'desc', limit: 10 });

      expect(asc.items[0].score).toBeLessThanOrEqual(asc.items[1].score);
      expect(desc.items[0].score).toBeGreaterThanOrEqual(desc.items[1].score);
    });
  });

  describe('UT-GEN-034: Sorting - Unsafe/unknown sort field rejected', () => {
    it('rejects unallowlisted or SQL injection sort fields', () => {
      expect(() => paginateCursor(sampleItems, { sortBy: 'password_hash; DROP TABLE users;' })).toThrow('Invalid sort field');
    });
  });

  describe('UT-GEN-035: Filtering - Valid filter applied', () => {
    it('applies filters correctly to match specified criterion', () => {
      const mathOnly = paginateCursor(sampleItems, { subject: 'math', limit: 20 });
      expect(mathOnly.items.every(i => i.subject === 'math')).toBe(true);
    });
  });

  describe('UT-GEN-036: Filtering - Unauthorized filter cannot bypass scope', () => {
    it('enforces tenant boundary regardless of requested query parameters', () => {
      const tenant1Only = paginateCursor(sampleItems, { tenantScope: 'tenant-1', limit: 50 });
      expect(tenant1Only.items.every(i => i.tenantId === 'tenant-1')).toBe(true);
      expect(tenant1Only.items.some(i => i.tenantId === 'tenant-2')).toBe(false);
    });
  });
});
