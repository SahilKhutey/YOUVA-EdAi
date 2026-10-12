import * as fs from 'fs';
import * as path from 'path';
import { validateBankFile, validateBankItem } from './item-bank';

const good = { content: 'Solve: x + 5 = 12', options: ['7', '17', '-7', '5'], correctAnswer: '7', difficulty: 0.2, explanation: 'Subtract 5.', reviewed: true, reviewedBy: 'Ms. Rao' };

describe('item bank validation', () => {
  it('accepts a complete, reviewed item', () => {
    expect(validateBankItem(good, 0)).toEqual([]);
  });
  it('rejects unreviewed items unless explicitly allowed', () => {
    const draft = { ...good, reviewed: false, reviewedBy: '' };
    expect(validateBankItem(draft, 0).length).toBeGreaterThan(0);
    expect(validateBankItem(draft, 0, true)).toEqual([]);
  });
  it('catches a correct answer that is not among the options', () => {
    expect(validateBankItem({ ...good, correctAnswer: '8' }, 0).join()).toMatch(/correctAnswer/);
  });
  it('catches duplicate options, wrong option count, bad difficulty, and a missing explanation', () => {
    expect(validateBankItem({ ...good, options: ['7', '7', '1', '2'] }, 0).join()).toMatch(/unique/);
    expect(validateBankItem({ ...good, options: ['7', '1'] }, 0).join()).toMatch(/4 options/);
    expect(validateBankItem({ ...good, difficulty: 2 }, 0).join()).toMatch(/difficulty/);
    expect(validateBankItem({ ...good, explanation: '' }, 0).join()).toMatch(/explanation/);
  });
  it('the shipped SAMPLE file is structurally valid but is blocked by the review gate', () => {
    const file = JSON.parse(fs.readFileSync(path.join(__dirname, '../../content/item-bank/one-step-equations.SAMPLE.json'), 'utf8'));
    expect(validateBankFile(file, true)).toEqual([]);
    expect(validateBankFile(file, false).length).toBeGreaterThan(0);
  });
});
