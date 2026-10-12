/** Validation rules for teacher-reviewed question items (pure functions, no database). */
export interface BankItem {
  content: string;
  options: string[];
  correctAnswer: string;
  difficulty: number; // 0.1 (easiest) .. 1.0 (hardest)
  explanation: string;
  reviewed?: boolean;
  reviewedBy?: string;
}

export function validateBankItem(item: any, index: number, allowUnreviewed = false): string[] {
  const errors: string[] = [];
  const at = `item ${index + 1}`;
  if (!item || typeof item !== 'object') return [`${at}: not an object`];
  if (typeof item.content !== 'string' || !item.content.trim()) errors.push(`${at}: content is required`);
  if (!Array.isArray(item.options) || item.options.length !== 4) {
    errors.push(`${at}: exactly 4 options are required`);
  } else {
    const trimmed = item.options.map((o: any) => (typeof o === 'string' ? o.trim() : ''));
    if (trimmed.some((o: string) => !o)) errors.push(`${at}: options must be non-empty strings`);
    if (new Set(trimmed).size !== trimmed.length) errors.push(`${at}: options must be unique`);
    if (!trimmed.includes(typeof item.correctAnswer === 'string' ? item.correctAnswer.trim() : '')) {
      errors.push(`${at}: correctAnswer must exactly match one of the options`);
    }
  }
  if (typeof item.difficulty !== 'number' || item.difficulty < 0.1 || item.difficulty > 1.0) {
    errors.push(`${at}: difficulty must be a number between 0.1 and 1.0`);
  }
  if (typeof item.explanation !== 'string' || !item.explanation.trim()) {
    errors.push(`${at}: explanation is required (students see it after answering)`);
  }
  if (!allowUnreviewed) {
    if (item.reviewed !== true) errors.push(`${at}: not marked reviewed:true`);
    if (typeof item.reviewedBy !== 'string' || !item.reviewedBy.trim()) errors.push(`${at}: reviewedBy (teacher name) is required`);
  }
  return errors;
}

export function validateBankFile(file: any, allowUnreviewed = false): string[] {
  const errors: string[] = [];
  for (const key of ['subject', 'topic']) {
    if (typeof file?.[key] !== 'string' || !file[key].trim()) errors.push(`file: "${key}" is required`);
  }
  if (!Array.isArray(file?.items) || file.items.length === 0) {
    errors.push('file: "items" must be a non-empty array');
    return errors;
  }
  file.items.forEach((it: any, i: number) => errors.push(...validateBankItem(it, i, allowUnreviewed)));
  return errors;
}
