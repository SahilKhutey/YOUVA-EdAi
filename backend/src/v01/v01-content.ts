import { LearningItem } from './v01.types';

export const CONCEPT_ID = 'one-step-equations';
export const CONCEPT_NAME = 'One-Step Linear Equations';

/**
 * Hand-authored, curated curriculum items for Middle School Math.
 * Concept: One-step linear equations (Grade 6-8).
 * Inverse operations: Addition/Subtraction, Multiplication/Division.
 */
export const V01_LEARNING_ITEMS: LearningItem[] = [
  // --- EASY (6 items): Single inverse operation with small positive integers ---
  {
    id: 'eq-easy-01',
    conceptId: CONCEPT_ID,
    question: 'Solve for x: x + 4 = 10',
    answer: '6',
    explanation: 'Subtract 4 from both sides: x = 10 - 4 = 6.',
    difficulty: 'EASY',
  },
  {
    id: 'eq-easy-02',
    conceptId: CONCEPT_ID,
    question: 'Solve for x: x - 3 = 7',
    answer: '10',
    explanation: 'Add 3 to both sides: x = 7 + 3 = 10.',
    difficulty: 'EASY',
  },
  {
    id: 'eq-easy-03',
    conceptId: CONCEPT_ID,
    question: 'Solve for y: y + 8 = 15',
    answer: '7',
    explanation: 'Subtract 8 from both sides: y = 15 - 8 = 7.',
    difficulty: 'EASY',
  },
  {
    id: 'eq-easy-04',
    conceptId: CONCEPT_ID,
    question: 'Solve for m: m - 5 = 12',
    answer: '17',
    explanation: 'Add 5 to both sides: m = 12 + 5 = 17.',
    difficulty: 'EASY',
  },
  {
    id: 'eq-easy-05',
    conceptId: CONCEPT_ID,
    question: 'Solve for x: 2x = 8',
    answer: '4',
    explanation: 'Divide both sides by 2: x = 8 / 2 = 4.',
    difficulty: 'EASY',
  },
  {
    id: 'eq-easy-06',
    conceptId: CONCEPT_ID,
    question: 'Solve for x: x / 3 = 4',
    answer: '12',
    explanation: 'Multiply both sides by 3: x = 4 * 3 = 12.',
    difficulty: 'EASY',
  },

  // --- MEDIUM (6 items): Larger numbers, two-digit products, and single negative signs ---
  {
    id: 'eq-med-01',
    conceptId: CONCEPT_ID,
    question: 'Solve for x: x + 17 = 35',
    answer: '18',
    explanation: 'Subtract 17 from both sides: x = 35 - 17 = 18.',
    difficulty: 'MEDIUM',
  },
  {
    id: 'eq-med-02',
    conceptId: CONCEPT_ID,
    question: 'Solve for x: x - 14 = -6',
    answer: '8',
    explanation: 'Add 14 to both sides: x = -6 + 14 = 8.',
    difficulty: 'MEDIUM',
  },
  {
    id: 'eq-med-03',
    conceptId: CONCEPT_ID,
    question: 'Solve for x: 4x = 52',
    answer: '13',
    explanation: 'Divide both sides by 4: x = 52 / 4 = 13.',
    difficulty: 'MEDIUM',
  },
  {
    id: 'eq-med-04',
    conceptId: CONCEPT_ID,
    question: 'Solve for x: x / 6 = 9',
    answer: '54',
    explanation: 'Multiply both sides by 6: x = 9 * 6 = 54.',
    difficulty: 'MEDIUM',
  },
  {
    id: 'eq-med-05',
    conceptId: CONCEPT_ID,
    question: 'Solve for x: x + (-8) = 11',
    answer: '19',
    explanation: 'x + (-8) is the same as x - 8 = 11. Add 8 to both sides: x = 11 + 8 = 19.',
    difficulty: 'MEDIUM',
  },
  {
    id: 'eq-med-06',
    conceptId: CONCEPT_ID,
    question: 'Solve for x: -5x = 45',
    answer: '-9',
    explanation: 'Divide both sides by -5: x = 45 / (-5) = -9.',
    difficulty: 'MEDIUM',
  },

  // --- HARD (6 items): Negative coefficients, decimals, reverse side variable ---
  {
    id: 'eq-hard-01',
    conceptId: CONCEPT_ID,
    question: 'Solve for x: x - (-15) = 8',
    answer: '-7',
    explanation: 'Subtracting a negative is adding: x + 15 = 8. Subtract 15 from both sides: x = 8 - 15 = -7.',
    difficulty: 'HARD',
  },
  {
    id: 'eq-hard-02',
    conceptId: CONCEPT_ID,
    question: 'Solve for x: -7x = -91',
    answer: '13',
    explanation: 'Divide both sides by -7: x = -91 / (-7) = 13.',
    difficulty: 'HARD',
  },
  {
    id: 'eq-hard-03',
    conceptId: CONCEPT_ID,
    question: 'Solve for x: x / (-4) = 16',
    answer: '-64',
    explanation: 'Multiply both sides by -4: x = 16 * (-4) = -64.',
    difficulty: 'HARD',
  },
  {
    id: 'eq-hard-04',
    conceptId: CONCEPT_ID,
    question: 'Solve for x: 12 = -3x',
    answer: '-4',
    explanation: 'Divide both sides by -3: x = 12 / (-3) = -4.',
    difficulty: 'HARD',
  },
  {
    id: 'eq-hard-05',
    conceptId: CONCEPT_ID,
    question: 'Solve for x: x + 3.5 = 10',
    answer: '6.5',
    explanation: 'Subtract 3.5 from both sides: x = 10 - 3.5 = 6.5.',
    difficulty: 'HARD',
  },
  {
    id: 'eq-hard-06',
    conceptId: CONCEPT_ID,
    question: 'Solve for x: x / 0.5 = 14',
    answer: '7',
    explanation: 'Multiply both sides by 0.5: x = 14 * 0.5 = 7.',
    difficulty: 'HARD',
  },
];
