
async function test() {
    const email = `student_${Date.now()}@test.com`;
    const password = 'password123';
    const role = 'STUDENT';

    try {
        // 1. Register/Login
        console.log('1. Registering/Logging in...');
        let token;

        // Initial Register
        const regRes = await fetch('http://localhost:3000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });

        // Login to get token
        const loginRes = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        token = loginData.access_token;
        console.log('Login successful. Token:', token ? 'Yes' : 'No');

        // 2. Get a Topic ID
        console.log('2. Fetching subjects/topics...');
        const subjectsRes = await fetch('http://localhost:3000/subjects', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const subjects = await subjectsRes.json();
        const topicId = subjects[0]?.topics[0]?.id;

        if (!topicId) throw new Error('No topics found. Seed db?');
        console.log('Found topic:', topicId);

        // 3. Start Learning Session
        console.log('3. Starting session...');
        const startRes = await fetch('http://localhost:3000/learning/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ topicId })
        });
        const startData = await startRes.json();
        console.log('Session started:', startData);
        const sessionId = startData.sessionId;

        // 4. Chat
        console.log('4. Sending chat message...');
        const chatRes = await fetch('http://localhost:3000/learning/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId, message: 'Hello AI, teach me something!' })
        });
        const chatData = await chatRes.json();
        console.log('Chat response:', chatData);

        console.log('TEST PASSED');

    } catch (e) {
        console.error('TEST FAILED:', e);
    }
}

test();
