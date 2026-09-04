const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Helper to upsert topics (findFirst + create pattern for SQLite/Non-unique fields)
    const upsertTopics = async (subjectId, topics) => {
        for (const topic of topics) {
            const existing = await prisma.topic.findFirst({
                where: {
                    title: topic.title,
                    subjectId: subjectId
                }
            });

            if (!existing) {
                await prisma.topic.create({
                    data: {
                        ...topic,
                        subjectId
                    }
                });
                console.log(`Created topic: ${topic.title}`);
            } else {
                console.log(`Topic already exists: ${topic.title}`);
            }
        }
    };

    // 1. Physics Subject
    const physics = await prisma.subject.upsert({
        where: { name: 'Physics' },
        update: {},
        create: {
            name: 'Physics',
            description: 'Study of matter, energy, and the fundamental forces of nature.',
        },
    });

    await upsertTopics(physics.id, [
        {
            title: 'Thermodynamics',
            description: 'Laws of thermodynamics, heat transfer, and entropy.',
            order: 1,
        },
        {
            title: 'Kinematics',
            description: 'Motion of objects without reference to forces.',
            order: 2,
        },
        {
            title: 'Electromagnetism',
            description: 'Study of electric and magnetic fields.',
            order: 3,
        },
    ]);

    // 2. Mathematics Subject
    const math = await prisma.subject.upsert({
        where: { name: 'Mathematics' },
        update: {},
        create: {
            name: 'Mathematics',
            description: 'The abstract science of number, quantity, and space.',
        },
    });

    await upsertTopics(math.id, [
        {
            title: 'Calculus Fundamentals',
            description: 'Limits, derivatives, and integrals.',
            order: 1,
        },
        {
            title: 'Linear Algebra',
            description: 'Vectors, vector spaces, and linear transformations.',
            order: 2,
        },
        {
            title: 'Probability & Statistics',
            description: 'Analysis and interpretation of data.',
            order: 3,
        },
    ]);

    // 3. Chemistry Subject
    const chemistry = await prisma.subject.upsert({
        where: { name: 'Chemistry' },
        update: {},
        create: {
            name: 'Chemistry',
            description: 'Properties, composition, and structure of substances.',
        },
    });

    await upsertTopics(chemistry.id, [
        {
            title: 'Organic Chemistry Basics',
            description: 'Structure, properties, and reactions of organic compounds.',
            order: 1,
        },
        {
            title: 'Chemical Bonding',
            description: 'Ionic, covalent, and metallic bonds.',
            order: 2,
        },
    ]);

    // 4. History Subject
    const history = await prisma.subject.upsert({
        where: { name: 'History' },
        update: {},
        create: {
            name: 'History',
            description: 'Study of past events, particularly in human affairs.',
        },
    });

    await upsertTopics(history.id, [
        {
            title: 'Modern History Review',
            description: 'Global events from the 18th century to the present.',
            order: 1,
        },
        {
            title: 'World War II',
            description: 'Causes, events, and aftermath of the Second World War.',
            order: 2,
        },
    ]);

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
