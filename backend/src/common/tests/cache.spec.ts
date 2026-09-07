describe('General Unit Tests: Caching & Cache Invalidation (UT-GEN-057 - UT-GEN-060)', () => {
  class MockCacheService {
    private cache = new Map<string, { value: any; expiresAt: number; isAuthoritativeMastery: boolean }>();

    set(key: string, value: any, ttlSeconds = 60, isAuthoritativeMastery = false) {
      if (isAuthoritativeMastery) {
        throw new Error('CachePolicyViolation: Authoritative mastery records must never be served from non-authoritative cache');
      }
      this.cache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
        isAuthoritativeMastery,
      });
    }

    get(key: string): any | null {
      const item = this.cache.get(key);
      if (!item) return null;
      if (Date.now() > item.expiresAt) {
        this.cache.delete(key);
        return null;
      }
      return item.value;
    }

    invalidate(key: string) {
      this.cache.delete(key);
    }

    async getOrLoad<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<{ fromCache: boolean; value: T }> {
      const cached = this.get(key);
      if (cached !== null) {
        return { fromCache: true, value: cached };
      }
      const loaded = await loader();
      this.set(key, loaded, ttlSeconds);
      return { fromCache: false, value: loaded };
    }
  }

  describe('UT-GEN-057: Cache - Cache hit returns expected value', () => {
    it('returns pre-cached value without calling loader', async () => {
      const cache = new MockCacheService();
      cache.set('curriculum:math:grade-5', { title: 'Grade 5 Math' });

      let loaderCalled = false;
      const res = await cache.getOrLoad('curriculum:math:grade-5', 60, async () => {
        loaderCalled = true;
        return { title: 'Fresh Load' };
      });

      expect(res.fromCache).toBe(true);
      expect(res.value.title).toBe('Grade 5 Math');
      expect(loaderCalled).toBe(false);
    });
  });

  describe('UT-GEN-058: Cache - Cache miss loads source', () => {
    it('executes loader on cache miss and populates cache', async () => {
      const cache = new MockCacheService();

      let loaderCalled = false;
      const res = await cache.getOrLoad('curriculum:science:grade-6', 60, async () => {
        loaderCalled = true;
        return { title: 'Grade 6 Science' };
      });

      expect(res.fromCache).toBe(false);
      expect(res.value.title).toBe('Grade 6 Science');
      expect(loaderCalled).toBe(true);

      // Verify cached
      expect(cache.get('curriculum:science:grade-6')).toEqual({ title: 'Grade 6 Science' });
    });
  });

  describe('UT-GEN-059: Cache - Cache invalidated after mutation', () => {
    it('purges cache key upon record mutation so subsequent reads get fresh data', async () => {
      const cache = new MockCacheService();
      cache.set('topic:fractions', { version: 1 });

      // Invalidate on update
      cache.invalidate('topic:fractions');
      expect(cache.get('topic:fractions')).toBeNull();

      // Read fresh
      const fresh = await cache.getOrLoad('topic:fractions', 60, async () => ({ version: 2 }));
      expect(fresh.value.version).toBe(2);
    });
  });

  describe('UT-GEN-060: Cache - Sensitive authoritative data not incorrectly cached', () => {
    it('rejects caching of authoritative mastery records to ensure real-time consistency', () => {
      const cache = new MockCacheService();
      expect(() => {
        cache.set('student:123:authoritative_mastery', { score: 1.0 }, 300, true);
      }).toThrow('CachePolicyViolation: Authoritative mastery records must never be served');
    });
  });
});
