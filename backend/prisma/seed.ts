import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const subjects = [
        {
            name: 'Mathematics',
            description: 'Study of numbers, shapes, and patterns.',
            topics: [
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
