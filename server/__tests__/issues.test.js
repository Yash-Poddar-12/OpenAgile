const request = require('supertest');
const { app, server } = require('../index');
const mongoose = require('mongoose');

describe('Issue Status Transitions Integration Tests', () => {
    let devToken;
    let viewerToken;
    let issueId;

    beforeAll(async () => {
        // Need real tokens for testing middleware
        const devLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'dev@filemap.dev', password: 'Dev@123' });
        
        const viewerLogin = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'viewer@filemap.dev', password: 'Viewer@123' });

        devToken = devLogin.body.token;
        viewerToken = viewerLogin.body.token;

        // Fetch a known issue from the seed data
        const res = await request(app)
            .get('/api/v1/issues')
            .set('Authorization', `Bearer ${devToken}`);
        
        issueId = res.body.issues[0]._id;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        server.close();
    });

    test('ToDo → InProgress allowed', async () => {
        // First reset status to ToDo
        await mongoose.model('Issue').findByIdAndUpdate(issueId, { status: 'ToDo' });

        const res = await request(app)
            .patch(`/api/v1/issues/${issueId}/status`)
            .send({ newStatus: 'InProgress' })
            .set('Authorization', `Bearer ${devToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body.issue.status).toBe('InProgress');
    });

    test('ToDo → Done not allowed directly', async () => {
        // Reset status to ToDo
        await mongoose.model('Issue').findByIdAndUpdate(issueId, { status: 'ToDo' });

        const res = await request(app)
            .patch(`/api/v1/issues/${issueId}/status`)
            .send({ newStatus: 'Done' })
            .set('Authorization', `Bearer ${devToken}`);
        
        expect(res.status).toBe(400); // 400 Bad Request for invalid transition
        expect(res.body.error).toContain('Invalid status transition');
    });

    test('Viewer cannot update status', async () => {
        const res = await request(app)
            .patch(`/api/v1/issues/${issueId}/status`)
            .send({ newStatus: 'InProgress' })
            .set('Authorization', `Bearer ${viewerToken}`);
        
        expect(res.status).toBe(403);
    });
});
