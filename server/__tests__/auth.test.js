const request = require('supertest');
const { app, server } = require('../index');
const mongoose = require('mongoose');

describe('Auth API Integration Tests', () => {
    // After all tests, close the server and DB connection
    afterAll(async () => {
        await mongoose.connection.close();
        server.close();
    });

    test('POST /api/v1/auth/login with valid credentials returns token', async () => {
        // Since we're using real DB, we assume the seed script has been run
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'admin@filemap.dev', password: 'Admin@123' });
        
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.role).toBe('Admin');
    });

    test('POST /api/v1/auth/login with wrong password returns 401', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'admin@filemap.dev', password: 'wrong' });
        
        expect(res.status).toBe(401);
    });

    test('GET /api/v1/auth/me without token returns 401', async () => {
        const res = await request(app).get('/api/v1/auth/me');
        expect(res.status).toBe(401);
    });

    test('GET /api/v1/auth/me with valid token returns user details', async () => {
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'admin@filemap.dev', password: 'Admin@123' });
        
        const res = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${loginRes.body.token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe('admin@filemap.dev');
    });
});
