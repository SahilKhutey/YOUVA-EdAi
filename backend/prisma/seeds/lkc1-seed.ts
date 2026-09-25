import { PrismaClient } from '@prisma/client';
import { hashKnowledgeContent } from '../../src/learning-knowledge/types/knowledge.types';

const prisma = new PrismaClient();

export async function seedLkc1Data() {
  console.log('Seeding LKC-1 Mathematics: Foundations of Algebra dataset...');

  const tenantId = 'youva-default-tenant';
  const authorId = 'teacher-seed-1';

  // 1. Ensure Subject exists
  const subject = await prisma.subject.upsert({
    where: { name: 'Mathematics' },
    update: {},
    create: {
      name: 'Mathematics',
      description: 'Core secondary mathematics curriculum',
    },
  });

  // 2. Ensure Topic exists
  const topic = await prisma.topic.upsert({
    where: { id: 'topic-linear-equations-seed' },
    update: {},
    create: {
      id: 'topic-linear-equations-seed',
      title: 'Linear Equations',
      description: 'Solving linear equations with one or more operations',
      subjectId: subject.id,
      order: 1,
    },
  });

  // 3. Create Concept: Equality
  const equalityContent = JSON.stringify({
    text: 'Equality is a fundamental mathematical relation stating that two quantities have the exact same value. The equals sign (=) represents a balanced scale.',
    katex: 'A = B \\iff A - B = 0',
  });
  const equalityObj = await prisma.knowledgeObject.upsert({
    where: { tenantId_slug: { tenantId, slug: 'concept-equality' } },
    update: {},
    create: {
      tenantId,
      type: 'CONCEPT',
      title: 'Concept of Equality',
      slug: 'concept-equality',
      description: 'Understanding mathematical balance and equivalence',
      subjectId: subject.id,
      topicId: topic.id,
      status: 'PUBLISHED',
      currentVersion: 1,
      createdBy: authorId,
      updatedBy: authorId,
      versions: {
        create: {
          version: 1,
          content: equalityContent,
          contentHash: hashKnowledgeContent(equalityContent),
          sourceType: 'TEACHER',
          reviewStatus: 'APPROVED',
          authorId,
          publishedAt: new Date(),
        },
      },
      objectives: {
        create: [
          { objective: 'Explain the equals sign as a balance relation', sequence: 0 },
        ],
      },
      tags: {
        create: [{ tag: 'equality' }, { tag: 'algebra' }, { tag: 'foundations' }],
      },
    },
  });

  // 4. Create Concept: Variables
  const variableContent = JSON.stringify({
    text: 'A variable is a symbol, usually a letter like x, y, or z, representing an unknown quantity or a value that can change.',
    katex: 'x \\in \\mathbb{R}',
  });
  const variableObj = await prisma.knowledgeObject.upsert({
    where: { tenantId_slug: { tenantId, slug: 'concept-variables' } },
    update: {},
    create: {
      tenantId,
      type: 'CONCEPT',
      title: 'Variables and Expressions',
      slug: 'concept-variables',
      description: 'Understanding symbols representing unknown numbers',
      subjectId: subject.id,
      topicId: topic.id,
      status: 'PUBLISHED',
      currentVersion: 1,
      createdBy: authorId,
      updatedBy: authorId,
      versions: {
        create: {
          version: 1,
          content: variableContent,
          contentHash: hashKnowledgeContent(variableContent),
          sourceType: 'TEACHER',
          reviewStatus: 'APPROVED',
          authorId,
          publishedAt: new Date(),
        },
      },
      objectives: {
        create: [
          { objective: 'Define variables in algebraic expressions', sequence: 0 },
        ],
      },
      tags: {
        create: [{ tag: 'variable' }, { tag: 'algebra' }],
      },
    },
  });

  // 5. Create Concept: Linear Equations
  const linearEqContent = JSON.stringify({
    text: 'A linear equation in one variable is an equation of the form ax + b = c, where a != 0. Solutions are found using inverse operations.',
    katex: 'ax + b = c \\implies x = \\frac{c - b}{a}',
  });
  const linearEqObj = await prisma.knowledgeObject.upsert({
    where: { tenantId_slug: { tenantId, slug: 'concept-linear-equations' } },
    update: {},
    create: {
      tenantId,
      type: 'CONCEPT',
      title: 'Linear Equations in One Variable',
      slug: 'concept-linear-equations',
      description: 'Formulating and solving single-variable linear equations',
      subjectId: subject.id,
      topicId: topic.id,
      status: 'PUBLISHED',
      currentVersion: 1,
      createdBy: authorId,
      updatedBy: authorId,
      versions: {
        create: {
          version: 1,
          content: linearEqContent,
          contentHash: hashKnowledgeContent(linearEqContent),
          sourceType: 'TEACHER',
          reviewStatus: 'APPROVED',
          authorId,
          publishedAt: new Date(),
        },
      },
      objectives: {
        create: [
          { objective: 'Identify linear equations in one variable', sequence: 0 },
          { objective: 'Solve linear equations using inverse operations', sequence: 1 },
        ],
      },
      tags: {
        create: [{ tag: 'linear-equations' }, { tag: 'algebra' }],
      },
    },
  });

  // 6. Establish Knowledge Relationships (Prerequisites)
  // Equality -> Linear Equations
  await prisma.knowledgeRelationship.upsert({
    where: {
      sourceId_targetId_relation: {
        sourceId: equalityObj.id,
        targetId: linearEqObj.id,
        relation: 'PREREQUISITE',
      },
    },
    update: {},
    create: {
      sourceId: equalityObj.id,
      targetId: linearEqObj.id,
      relation: 'PREREQUISITE',
      weight: 1.0,
      createdBy: authorId,
    },
  });

  // Variables -> Linear Equations
  await prisma.knowledgeRelationship.upsert({
    where: {
      sourceId_targetId_relation: {
        sourceId: variableObj.id,
        targetId: linearEqObj.id,
        relation: 'PREREQUISITE',
      },
    },
    update: {},
    create: {
      sourceId: variableObj.id,
      targetId: linearEqObj.id,
      relation: 'PREREQUISITE',
      weight: 1.0,
      createdBy: authorId,
    },
  });

  // 7. Create Lesson: Solving One-Step Equations
  const lessonContent = JSON.stringify({
    summary: 'A step-by-step introduction to isolating variables using addition and subtraction.',
    sections: [
      { type: 'EXPLANATION', title: 'The Scale Metaphor' },
      { type: 'WORKED_EXAMPLE', title: 'Solving x + 5 = 12' },
      { type: 'PRACTICE', title: 'Check Your Understanding' },
    ],
  });
  await prisma.knowledgeObject.upsert({
    where: { tenantId_slug: { tenantId, slug: 'lesson-solving-one-step-equations' } },
    update: {},
    create: {
      tenantId,
      type: 'LESSON',
      title: 'Solving One-Step Equations',
      slug: 'lesson-solving-one-step-equations',
      description: 'Mastering single inverse operation equations',
      subjectId: subject.id,
      topicId: topic.id,
      parentId: linearEqObj.id,
      status: 'PUBLISHED',
      currentVersion: 1,
      createdBy: authorId,
      updatedBy: authorId,
      versions: {
        create: {
          version: 1,
          content: lessonContent,
          contentHash: hashKnowledgeContent(lessonContent),
          sourceType: 'TEACHER',
          reviewStatus: 'APPROVED',
          authorId,
          publishedAt: new Date(),
        },
      },
      objectives: {
        create: [
          { objective: 'Isolate a variable in one step', sequence: 0 },
        ],
      },
      tags: {
        create: [{ tag: 'lesson' }, { tag: 'one-step' }],
      },
    },
  });

  console.log('LKC-1 seed complete: Mathematics / Linear Equations knowledge graph initialized.');
}

if (require.main === module) {
  seedLkc1Data()
    .catch((e) => {
      console.error('LKC-1 seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
