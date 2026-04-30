import mock from './mockAdapter';

// Mock auth endpoint for template demo mode
const demoUsers = [
    {
        id: 1,
        username: 'info@wrappixel.com',
        email: 'info@wrappixel.com',
        password: 'admin123',
        firstName: 'Wrappixel',
        lastName: '.com',
        name: 'Wrappixel User'
    }
];

mock.onPost('/auth/login').reply((config) => {
    try {
        const { username, password } = JSON.parse(config.data || '{}');
        const user = demoUsers.find((u) => u.username === username && u.password === password);

        if (!user) {
            return [
                400,
                {
                    error: 'Username or password is incorrect'
                }
            ];
        }

        // Return successful auth response matching the expected shape
        return [
            200,
            {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    name: user.name
                },
                accessToken: 'fake-jwt-token-' + user.id,
                refreshToken: 'fake-refresh-token'
            }
        ];
    } catch {
        return [
            500,
            {
                error: 'Server error'
            }
        ];
    }
});


