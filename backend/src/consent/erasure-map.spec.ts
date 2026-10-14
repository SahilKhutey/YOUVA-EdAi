import { Prisma } from '@prisma/client';
import { ERASED, MANUAL_CHECK, RETAINED, TEACHER_OWNED } from './erasure-map';

/** Guardrail: any table that stores a user/student/teacher id must be classified for erasure. */
describe('erasure map covers every table holding user ids', () => {
  const idFields = new Set(['userId', 'studentId', 'teacherId']);
  const holders = Prisma.dmmf.datamodel.models
    .filter((m) => m.fields.some((f) => idFields.has(f.name)))
    .map((m) => m.name);
  const classified = new Set([...ERASED.map((r) => r.model), ...MANUAL_CHECK.map((r) => r.model), ...RETAINED, ...TEACHER_OWNED]);

  it('has no unclassified table (add new tables to erasure-map.ts)', () => {
    expect(holders.filter((m) => !classified.has(m))).toEqual([]);
  });

  it('only references tables that exist, using a field that exists on that table', () => {
    for (const r of [...ERASED, ...MANUAL_CHECK]) {
      const model = Prisma.dmmf.datamodel.models.find((m) => m.name === r.model);
      expect(model).toBeDefined();
      expect(model!.fields.some((f) => f.name === r.field)).toBe(true);
    }
  });

  it('never lists a table twice', () => {
    const all = [...ERASED.map((r) => r.model), ...MANUAL_CHECK.map((r) => r.model), ...RETAINED, ...TEACHER_OWNED];
    expect(new Set(all).size).toBe(all.length);
  });
});
