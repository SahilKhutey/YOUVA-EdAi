import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const subjects = [
        {
            name: 'Mathematics',
            description: 'Study of numbers, shapes, and patterns.',
            topics: [
                { title: 'Linear Equations in One Variable', description: 'Grade 8 CBSE Chapter 2: Algebraic solving methods and applications.' },
                { title: 'Algebra', description: 'Operations and relations.' },
                { title: 'Geometry', description: 'Properties of space.' },
                { title: 'Calculus', description: 'Change and motion.' },
                { title: 'Statistics', description: 'Data collection and analysis.' },
                { title: 'Trigonometry', description: 'Relationships between side lengths and angles of triangles.' },
            ],
        },
        {
            name: 'Physics',
            description: 'Study of matter and energy.',
            topics: [
                { title: 'Mechanics', description: 'Motion and forces.' },
                { title: 'Thermodynamics', description: 'Heat and energy.' },
                { title: 'Electromagnetism', description: 'Electricity and magnetism.' },
                { title: 'Quantum Mechanics', description: 'Behavior of matter and light on the atomic and subatomic scale.' },
                { title: 'Optics', description: 'Behavior and properties of light.' },
            ],
        },
        {
            name: 'Chemistry',
            description: 'Study of substances and their changes.',
            topics: [
                { title: 'Organic Chemistry', description: 'Carbon compounds.' },
                { title: 'Inorganic Chemistry', description: 'Other compounds.' },
                { title: 'Physical Chemistry', description: 'Chemical systems properties.' },
            ],
        },
        {
            name: 'Biology',
            description: 'Study of living organisms.',
            topics: [
                { title: 'Cell Biology', description: 'Cells and their functions.' },
                { title: 'Genetics', description: 'Heredity and variation.' },
                { title: 'Ecology', description: 'Interactions among organisms and their environment.' },
            ],
        },
        {
            name: 'History',
            description: 'Study of past events.',
            topics: [
                { title: 'World War II', description: 'Global conflict from 1939 to 1945.' },
                { title: 'The Renaissance', description: 'Rebirth of art and learning.' },
                { title: 'Ancient Civilizations', description: 'Early human societies.' },
            ],
        },
        {
            name: 'Computer Science',
            description: 'Study of computation and information.',
            topics: [
                { title: 'Data Structures', description: 'Organizing and storing data.' },
                { title: 'Algorithms', description: 'Step-by-step procedures for calculations.' },
                { title: 'Artificial Intelligence', description: 'Simulation of human intelligence.' },
            ],
        },
    ];

    for (const subjectData of subjects) {
        const { topics, ...data } = subjectData;
        const subject = await prisma.subject.upsert({
            where: { name: data.name },
            update: {},
            create: {
                ...data,
                topics: {
                    create: topics,
                },
            },
        });
        console.log(`Created or Updated subject: ${subject.name}`);
    }

    // Seed Verified Phase 1 Question Bank for Grade 8 Linear Equations
    const linearEquationsTopic = await prisma.topic.findFirst({
        where: { title: 'Linear Equations in One Variable' }
    });

    if (linearEquationsTopic) {
        const verifiedQuestions = [
            { content: 'Solve for x: 2x - 3 = 7', options: ['x = 2', 'x = 5', 'x = 4', 'x = 10'], correctAnswer: 'x = 5', explanation: 'Add 3 to both sides: 2x = 10. Divide by 2: x = 5.', difficulty: 0.3 },
            { content: 'Solve for y: y + 3 = 10', options: ['y = 7', 'y = 13', 'y = 3', 'y = 30'], correctAnswer: 'y = 7', explanation: 'Subtract 3 from both sides: y = 10 - 3 = 7.', difficulty: 0.2 },
            { content: 'Solve for z: 6 = z + 2', options: ['z = 8', 'z = 4', 'z = 3', 'z = 12'], correctAnswer: 'z = 4', explanation: 'Subtract 2 from both sides: z = 6 - 2 = 4.', difficulty: 0.2 },
            { content: 'Solve for x: 3/7 + x = 17/7', options: ['x = 2', 'x = 14/7', 'x = 20/7', 'x = 14'], correctAnswer: 'x = 2', explanation: 'Subtract 3/7 from both sides: x = (17 - 3)/7 = 14/7 = 2.', difficulty: 0.5 },
            { content: 'Solve for x: 6x = 12', options: ['x = 6', 'x = 2', 'x = 18', 'x = 72'], correctAnswer: 'x = 2', explanation: 'Divide both sides by 6: x = 12 / 6 = 2.', difficulty: 0.2 },
            { content: 'Solve for t: t/5 = 10', options: ['t = 2', 't = 15', 't = 50', 't = 5'], correctAnswer: 't = 50', explanation: 'Multiply both sides by 5: t = 10 * 5 = 50.', difficulty: 0.2 },
            { content: 'Solve for x: 2x/3 = 18', options: ['x = 27', 'x = 12', 'x = 54', 'x = 9'], correctAnswer: 'x = 27', explanation: 'Multiply by 3: 2x = 54. Divide by 2: x = 27.', difficulty: 0.5 },
            { content: 'Solve for x: 7x - 9 = 16', options: ['x = 25/7', 'x = 1', 'x = 7', 'x = 25'], correctAnswer: 'x = 25/7', explanation: 'Add 9 to both sides: 7x = 25. Divide by 7: x = 25/7.', difficulty: 0.5 },
            { content: 'Solve for y: 14y - 8 = 13', options: ['y = 3/2', 'y = 5/14', 'y = 21/14', 'y = 1.5'], correctAnswer: 'y = 3/2', explanation: 'Add 8: 14y = 21. Divide by 14: y = 21/14 = 3/2.', difficulty: 0.5 },
            { content: 'Solve for p: 17 + 6p = 9', options: ['p = 4/3', 'p = -4/3', 'p = -8/6', 'p = -2'], correctAnswer: 'p = -4/3', explanation: 'Subtract 17: 6p = 9 - 17 = -8. Divide by 6: p = -8/6 = -4/3.', difficulty: 0.7 },
            { content: 'Solve for x: 5x + 9 = 5 + 3x', options: ['x = 2', 'x = -2', 'x = 7', 'x = -7'], correctAnswer: 'x = -2', explanation: 'Subtract 3x: 2x + 9 = 5. Subtract 9: 2x = -4. Divide by 2: x = -2.', difficulty: 0.6 },
            { content: 'Solve for z: 4z + 3 = 6 + 2z', options: ['z = 3/2', 'z = 9/2', 'z = 2/3', 'z = 1'], correctAnswer: 'z = 3/2', explanation: 'Subtract 2z: 2z + 3 = 6. Subtract 3: 2z = 3. Divide by 2: z = 3/2.', difficulty: 0.6 },
            { content: 'Solve for x: 2x - 1 = 14 - x', options: ['x = 5', 'x = 15', 'x = 13/3', 'x = 4'], correctAnswer: 'x = 5', explanation: 'Add x: 3x - 1 = 14. Add 1: 3x = 15. Divide by 3: x = 5.', difficulty: 0.6 },
            { content: 'Solve for x: 8x + 4 = 3(x - 1) + 7', options: ['x = 0', 'x = 1', 'x = -1', 'x = 2'], correctAnswer: 'x = 0', explanation: 'Expand RHS: 8x + 4 = 3x - 3 + 7 = 3x + 4. Subtract 3x: 5x + 4 = 4. 5x = 0, so x = 0.', difficulty: 0.7 },
            { content: 'Solve for x: x = (4/5)(x + 10)', options: ['x = 40', 'x = 8', 'x = 10', 'x = 50'], correctAnswer: 'x = 40', explanation: 'Multiply both sides by 5: 5x = 4(x + 10) = 4x + 40. Subtract 4x: x = 40.', difficulty: 0.7 },
            { content: 'Solve for m: 3m = 5m - 8/5', options: ['m = 4/5', 'm = 8/5', 'm = -4/5', 'm = 2/5'], correctAnswer: 'm = 4/5', explanation: 'Subtract 5m: -2m = -8/5. Divide by -2: m = (-8/5) / (-2) = 4/5.', difficulty: 0.7 },
            { content: 'The perimeter of a rectangle is 13 cm and its width is 2 3/4 cm. Find its length.', options: ['3 3/4 cm', '4 cm', '5 1/2 cm', '2 1/4 cm'], correctAnswer: '3 3/4 cm', explanation: 'Perimeter = 2(l + w) = 13. l + 11/4 = 13/2 = 26/4. l = 26/4 - 11/4 = 15/4 = 3 3/4 cm.', difficulty: 0.8 },
            { content: 'The sum of three consecutive multiples of 8 is 888. Find the smallest multiple.', options: ['288', '296', '304', '280'], correctAnswer: '288', explanation: 'Multiples are x, x+8, x+16. Sum = 3x + 24 = 888. 3x = 864, so x = 288.', difficulty: 0.8 },
            { content: 'Three consecutive integers add up to 51. What is the largest integer?', options: ['18', '16', '17', '19'], correctAnswer: '18', explanation: 'Integers: n, n+1, n+2. Sum = 3n + 3 = 51. 3n = 48, so n = 16. Largest is n + 2 = 18.', difficulty: 0.6 },
            { content: 'If you subtract 1/2 from a number and multiply the result by 1/2, you get 1/8. What is the number?', options: ['3/4', '1/4', '1/2', '1'], correctAnswer: '3/4', explanation: '(x - 1/2) * 1/2 = 1/8. x - 1/2 = 2/8 = 1/4. x = 1/4 + 1/2 = 3/4.', difficulty: 0.8 }
        ];

        for (const q of verifiedQuestions) {
            const existing = await prisma.question.findFirst({
                where: { topicId: linearEquationsTopic.id, content: q.content }
            });
            if (!existing) {
                await prisma.question.create({
                    data: {
                        topicId: linearEquationsTopic.id,
                        content: q.content,
                        type: 'MCQ',
                        difficulty: q.difficulty,
                        options: JSON.stringify(q.options),
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation
                    }
                });
            }
        }
        console.log(`Seeded ${verifiedQuestions.length} verified Phase 1 questions for ${linearEquationsTopic.title}`);
    }

    // Provision Demo Accounts
    const hashedPassword = await bcrypt.hash('password123', 10);

    await prisma.user.upsert({
        where: { email: 'student@test.com' },
        update: {},
        create: {
            email: 'student@test.com',
            password: hashedPassword,
            name: 'Demo Student',
            role: 'STUDENT',
            onboardingComplete: true
        }
    });
    console.log('Created Demo Student');

    await prisma.user.upsert({
        where: { email: 'teacher@test.com' },
        update: {},
        create: {
            email: 'teacher@test.com',
            password: hashedPassword,
            name: 'Demo Teacher',
            role: 'TEACHER',
            onboardingComplete: true
        }
    });
    console.log('Created Demo Teacher');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
