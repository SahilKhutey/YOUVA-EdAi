
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    const email = `student_${Date.now()}@test.com`;
    const password = 'password123';
    const role = 'STUDENT';

    try {
        // 1. Register/Login
        console.log('1. Registering/Logging in...');
        let token;
        let userId;

        // Initial Register
        const regRes = await fetch('http://localhost:3000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });
        const regData = await regRes.json();
        userId = regData.id; // Assuming register returns user object

        // Login to get token
        const loginRes = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        token = loginData.access_token;
        if (!userId) userId = loginData.user?.id; // Fallback if register didn't return id

        console.log('Login successful. Token:', token ? 'Yes' : 'No');

        // 2. Seed some low mastery data directly (using Prisma Client in script for speed, or API if possible)
        // We'll use the API loop if possible, or just assume the server uses the same DB.
        // Since we are running local, we can assume same DB.

        // First get a topic
        const subjectsRes = await fetch('http://localhost:3000/subjects', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const subjects = await subjectsRes.json();
        const topicId = subjects[0]?.topics[0]?.id;

        if (topicId) {
            console.log('Seeding low mastery for topic:', topicId);
            // We can't directly seed via API easily without taking a quiz.
            // Let's just submit a quiz with 0 score.

            // Generate
            const genRes = await fetch('http://localhost:3000/practice/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ topicId })
            });
            const genData = await genRes.json();

            // Submit all wrong
            const answers = genData.questions.map(q => ({
                questionId: q.id,
                answer: "Wrong Answer"
            }));

            await fetch('http://localhost:3000/practice/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ sessionId: genData.sessionId, answers })
            });
            console.log('Submitted quiz with 0 score.');
        }

        // 3. Fetch Revision Suggestions
        console.log('3. Fetching revision suggestions...');
        const revRes = await fetch('http://localhost:3000/revision/suggestions', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const suggestions = await revRes.json();
        console.log('Suggestions:', JSON.stringify(suggestions, null, 2));

        if (!Array.isArray(suggestions)) throw new Error('Suggestions should be an array');
        if (suggestions.length > 0) {
            if (suggestions[0].masteryScore >= 70) throw new Error('Suggestion returned high mastery topic!');
        }

        console.log('TEST PASSED');

    } catch (e) {
        console.error('TEST FAILED:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
