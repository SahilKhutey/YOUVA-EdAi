// Native fetch
async function test() {
    const email = `testuser_${Date.now()}@example.com`;
    const password = 'password123';
    const role = 'STUDENT';

    try {
        console.log('Registering user:', email);
        const registerRes = await fetch('http://localhost:3000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });
        const registerData = await registerRes.json();
        if (!registerRes.ok) throw new Error(JSON.stringify(registerData));
        console.log('Registration successful:', registerData);

        console.log('Logging in...');
        const loginRes = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(JSON.stringify(loginData));

        const token = loginData.access_token;
        console.log('Login successful, token received.');

        console.log('Fetching subjects...');
        const subjectsRes = await fetch('http://localhost:3000/subjects', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        });
        const subjectsData = await subjectsRes.json();
        if (!subjectsRes.ok) throw new Error(JSON.stringify(subjectsData));

        console.log('Subjects fetched:', subjectsData);

        if (subjectsData.length > 0) {
            console.log('SUCCESS: Subjects found in DB.');
        } else {
            console.log('WARNING: No subjects found (seed might have failed? or empty db)');
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
