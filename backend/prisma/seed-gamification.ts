import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const badges = [
        { name: 'Novice Learner', description: 'Earn 100 XP', icon: 'star', requirementType: 'XP', requirementValue: 100 },
        { name: 'Dedicated Learner', description: 'Earn 500 XP', icon: 'award', requirementType: 'XP', requirementValue: 500 },
        { name: '3-Day Streak', description: 'Study 3 days in a row', icon: 'flame', requirementType: 'STREAK', requirementValue: 3 },
        { name: '7-Day Streak', description: 'Study 7 days in a row', icon: 'flame-hot', requirementType: 'STREAK', requirementValue: 7 },
    ];

    for (const badge of badges) {
        await prisma.badge.upsert({
            where: { name: badge.name },
            update: {},
            create: badge,
        });
        console.log(`Created badge: ${badge.name}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
