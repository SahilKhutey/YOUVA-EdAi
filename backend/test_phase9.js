
async function test() {
    const email = `user_${Date.now()}@test.com`;
    const password = 'password123';
    const role = 'STUDENT';

    try {
        console.log('1. Registering/Logging in...');
        // Register
        await fetch('http://localhost:3000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });

        // Login
        const loginRes = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        const token = loginData.access_token;
        console.log('Login successful.');

        // 2. Update Profile
        console.log('2. Updating Profile...');
        const updateRes = await fetch('http://localhost:3000/users/profile', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: 'Updated Name' })
        });
        const updateData = await updateRes.json();
        console.log('Profile Updated:', updateData);
        if (updateData.name !== 'Updated Name') throw new Error('Profile update failed');

        // 3. Create Checkout Session
        console.log('3. Creating Checkout Session...');
        const checkoutRes = await fetch('http://localhost:3000/subscription/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ plan: 'PRO' })
        });
        const checkoutData = await checkoutRes.json();
        console.log('Checkout URL:', checkoutData.url);

        // 4. Mock Success
        console.log('4. Mocking Success Callback...');
        // We need to extract the userId from the token or the update response since the mock callback needs it.
        // The backend endpoint uses @Request user, but the callback uses query params.
        const userId = updateData.id;
        await fetch(`http://localhost:3000/subscription/success-mock?userId=${userId}&plan=PRO`);

        // 5. Check Subscription Status
        console.log('5. Checking Subscription Status...');
        const statusRes = await fetch('http://localhost:3000/subscription/status', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const statusData = await statusRes.json();
        console.log('Subscription Status:', statusData);

        if (statusData.plan !== 'PRO' || statusData.status !== 'ACTIVE') throw new Error('Subscription verification failed');

        console.log('TEST PASSED');

    } catch (e) {
        console.error('TEST FAILED:', e);
    }
}

test();
