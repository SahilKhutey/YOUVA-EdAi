
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
        console.log('Login successful.');

        // 2. Fetch Analytics Summary
        console.log('2. Fetching analytics summary...');
        const res = await fetch('http://localhost:3000/analytics/summary', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log('Analytics Summary:', JSON.stringify(data, null, 2));

        if (!Array.isArray(data.activityData) || !Array.isArray(data.masteryData)) {
            throw new Error('Invalid data structure');
        }

        console.log('TEST PASSED');

    } catch (e) {
        console.error('TEST FAILED:', e);
    }
}

test();
