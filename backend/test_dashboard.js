
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

        // 2. Fetch Dashboard Stats
        console.log('2. Fetching dashboard stats...');
        const statsRes = await fetch('http://localhost:3000/dashboard/stats', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const stats = await statsRes.json();
        console.log('Dashboard Stats:', JSON.stringify(stats, null, 2));

        if (!stats.overallMastery && stats.overallMastery !== 0) throw new Error('Missing overallMastery');
        if (!stats.subjectProgress) throw new Error('Missing subjectProgress');

        console.log('TEST PASSED');

    } catch (e) {
        console.error('TEST FAILED:', e);
    }
}

test();
