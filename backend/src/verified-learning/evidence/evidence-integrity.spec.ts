import {
  EvidenceIntegrityService,
  hashCanonicalEvidence,
} from './evidence-integrity.service';

describe('Evidence Integrity & Cryptographic Hashing', () => {
  describe('hashCanonicalEvidence', () => {
    it('produces the same hash for reordered keys', () => {
      const first = {
        answer: '42',
        score: 1,
      };

      const second = {
        score: 1,
        answer: '42',
      };

      expect(hashCanonicalEvidence(first)).toBe(hashCanonicalEvidence(second));
    });

    it('changes when evidence changes', () => {
      const first = {
        answer: '42',
      };

      const second = {
        answer: '43',
      };

      expect(hashCanonicalEvidence(first)).not.toBe(hashCanonicalEvidence(second));
    });
  });

  describe('EvidenceIntegrityService', () => {
    let service: EvidenceIntegrityService;

    beforeEach(() => {
      service = new EvidenceIntegrityService();
    });

    it('accepts valid evidence matching cryptographic digest', () => {
      const evidence = {
        answer: '42',
        score: 1,
      };

      const hash = hashCanonicalEvidence(evidence);

      expect(service.verify(evidence, hash)).toBe(true);
    });

    it('rejects modified evidence with ConflictException', () => {
      const original = {
        answer: '42',
      };

      const hash = hashCanonicalEvidence(original);

      expect(() => service.verify({ answer: '43' }, hash)).toThrow();
    });
  });
});
