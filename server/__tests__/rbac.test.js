const request = require('supertest');
const { app, server } = require('../index');
const mongoose = require('mongoose');

describe('RBAC Middleware Integration Tests', () => {
    let adminToken;
    let devToken;
    let viewerToken;

    beforeAll(async () => {
        // Authenticate as different roles
        const adminLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'admin@filemap.dev', password: 'Admin@123' });
        
        const devLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'dev@filemap.dev', password: 'Dev@123' });
        
        const viewerLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'viewer@filemap.dev', password: 'Viewer@123' });

        adminToken = adminLogin.body.token;
        devToken = devLogin.body.token;
        viewerToken = viewerLogin.body.token;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        server.close();
    });

    test('Admin can access GET /api/v1/users', async () => {
        const res = await request(app)
            .get('/api/v1/users')
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(200);
    });

    test('Developer cannot access GET /api/v1/users', async () => {
        const res = await request(app)
            .get('/api/v1/users')
            .set('Authorization', `Bearer ${devToken}`);
        
        expect(res.status).toBe(403);
    });

    test('Viewer cannot POST /api/v1/export', async () => {
        const res = await request(app)
            .post('/api/v1/export')
            .send({ artifacts: ['CSV'], projectId: 'any' })
            .set('Authorization', `Bearer ${viewerToken}`);
        
        expect(res.status).toBe(403);
    });
});
