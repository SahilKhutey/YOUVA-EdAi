
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

        // 3. Generate Quiz
        console.log('3. Generating quiz...');
        const genRes = await fetch('http://localhost:3000/practice/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ topicId })
        });
        const genData = await genRes.json();
        console.log('Quiz generated. Session ID:', genData.sessionId);
        console.log('Number of questions:', genData.questions?.length);
        const sessionId = genData.sessionId;
        const questions = genData.questions;

        if (!questions || questions.length === 0) throw new Error('No questions generated');

        // 4. Submit Quiz (Random answers)
        console.log('4. Submitting quiz...');
        const answers = questions.map(q => ({
            questionId: q.id,
            answer: q.options[0] // Just pick the first option
        }));

        const submitRes = await fetch('http://localhost:3000/practice/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId, answers })
        });
        const submitData = await submitRes.json();
        console.log('Submission result:', submitData);

        console.log('TEST PASSED');

    } catch (e) {
        console.error('TEST FAILED:', e);
    }
}

test();
