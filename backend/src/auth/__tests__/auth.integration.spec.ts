// Integration tests skeleton with Supertest for cookie/CSRF/rotate flows
// NOTE: Requires e2e bootstrap (app, in-memory Mongo/real test DB). Marked as skipped until harness is wired.

import request from 'supertest';

describe.skip('Auth integration (cookies, CSRF, rotate)', () => {
  // let app: INestApplication;
  // beforeAll(async () => { /* bootstrap Nest app for e2e */ });
  // afterAll(async () => { await app.close(); });

  it('login sets cookies with correct flags', async () => {
    // const res = await request(app.getHttpServer())
    //   .post('/api/v1/auth/login')
    //   .send({ email: 'a@b.com', password: 'secret' })
    //   .expect(201);
    // const setCookie = res.headers['set-cookie'] as string[];
    // expect(setCookie.join(';')).toMatch(/access_token=.*HttpOnly/);
    // expect(setCookie.join(';')).toMatch(/refresh_token=.*HttpOnly/);
    // expect(setCookie.join(';')).toMatch(/csrf_token=.*SameSite=Strict/);
  });

  it('refresh happy path rotates and sets new cookies', async () => {
    // const agent = request.agent(app.getHttpServer());
    // await agent.post('/api/v1/auth/login').send({ email, password });
    // const cookies = (await agent.get('/api/v1/health')).headers['set-cookie'];
    // const csrf = extractCookieValue(cookies, 'csrf_token');
    // await agent
    //   .post('/api/v1/auth/refresh')
    //   .set('X-CSRF-Token', csrf)
    //   .expect(201);
  });

  it('refresh replay returns 401 and revokes all', async () => {
    // Use old refresh cookie after successful rotate
  });

  it('logout clears cookies and revokes token', async () => {
    // const agent = request.agent(app.getHttpServer());
    // await agent.post('/api/v1/auth/login').send({ email, password });
    // await agent.post('/api/v1/auth/logout').expect(201);
  });

  it('CSRF missing/wrong returns 403 for state-changing endpoints', async () => {
    // await request(app.getHttpServer())
    //   .post('/api/v1/auth/refresh')
    //   .expect(403);
  });
});


