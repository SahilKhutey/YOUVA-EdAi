/**
 * Usage: npx ts-node prisma/import-item-bank.ts content/item-bank/<file>.json [--allow-unreviewed]
 * Imports teacher-reviewed items into the Question table with source = "BANK".
 * Refuses unreviewed items unless --allow-unreviewed is passed (use only on a dev database).
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import { validateBankFile } from '../src/practice/item-bank';

async function main() {
  const [path, ...flags] = process.argv.slice(2);
  if (!path) throw new Error('Provide a path to an item-bank JSON file.');
  const allowUnreviewed = flags.includes('--allow-unreviewed');
  const file = JSON.parse(fs.readFileSync(path, 'utf8'));
  const errors = validateBankFile(file, allowUnreviewed);
  if (errors.length) {
    console.error('Item bank rejected:\n - ' + errors.join('\n - '));
    process.exit(1);
  }
  const prisma = new PrismaClient();
  try {
    const subject = await prisma.subject.upsert({
      where: { name: file.subject },
      update: {},
      create: { name: file.subject, description: file.subjectDescription ?? null },
    });
    let topic = await prisma.topic.findFirst({ where: { subjectId: subject.id, title: file.topic } });
    if (!topic) {
      topic = await prisma.topic.create({
        data: { title: file.topic, description: file.topicDescription ?? null, subjectId: subject.id },
      });
    }
    let created = 0;
    for (const it of file.items) {
      const exists = await prisma.question.findFirst({ where: { topicId: topic.id, source: 'BANK', content: it.content } });
      if (exists) continue;
      await prisma.question.create({
        data: {
          topicId: topic.id,
          content: it.content,
          type: 'MCQ',
          difficulty: it.difficulty,
          options: JSON.stringify(it.options),
          correctAnswer: it.correctAnswer,
          explanation: it.explanation,
          source: 'BANK',
        },
      });
      created++;
    }
    console.log(`Imported ${created} new item(s) into "${file.subject} / ${file.topic}" (${file.items.length - created} already present).`);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
