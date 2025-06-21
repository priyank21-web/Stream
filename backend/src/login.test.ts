import request from 'supertest';
import express from 'express';
import { createServer } from 'http';
import app from './index';

describe('/login endpoint', () => {
    let server: any;
    beforeAll((done) => {
        server = createServer(app);
        server.listen(done);
    });
    afterAll((done) => {
        server.close(done);
    });

    it('should return a token for correct credentials', async () => {
        const res = await request(server)
            .post('/login')
            .send({ username: 'admin', password: 'password' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    it('should fail for wrong credentials', async () => {
        const res = await request(server)
            .post('/login')
            .send({ username: 'admin', password: 'wrong' });
        expect(res.status).toBe(401);
    });
}); 