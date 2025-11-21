import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModules } from './module.index';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mariadb',
          host: 'mariadb',
          port: 3306,
          username: 'rt_mart_user',
          password: 'rt_mart_and_the_user_password_yeah_very_cool123*',
          database: 'rt_mart_db',
          autoLoadEntities: true,
          migrations: ['../src/migrations/*.js'],
        }),
        ...AppModules,
      ],}).compile();
      
    app = moduleFixture.createNestApplication();
    await app.init();
  }, 1000);

  afterAll(async () => {
    await app.close();
  });

  let testUserId: string[] = [];
  let testUserLoginId = ['buyer_user', 'seller_user', 'admin_user'];

  it('/users (POST) → create the users ', async () => {
    const users = [
      {
        loginId: testUserLoginId[0],
        password: '!abc12345678',
        name: '測試用帳號1',
        email: testUserLoginId[0] + '@example.com',
        phone: '0912345678',
        role: 'buyer',
      },
      {
        loginId: testUserLoginId[1],
        password: '?abc12345678',
        name: '測試用帳號2',
        email: testUserLoginId[1] + '@example.com',
        phone: '0912345678',
        role: 'seller',
      },
      {
        loginId: testUserLoginId[2],
        password: '.abc12345678',
        name: '測試用帳號3',
        email: testUserLoginId[2] + '@example.com',
        phone: '0912345678',
        role: 'admin',
      },
    ];

    for (const u of users) {
      const res = await request(app.getHttpServer())
        .post('/users')
        .send(u)
        .expect(201);

      expect(res.body).toHaveProperty('userId');
      expect(res.body.loginId).toBe(u.loginId);
      testUserId.push(res.body.userId);
    }
    expect(testUserId).toHaveLength(3);
  });

  it('/users (POST) → create a user with conflict', async () => {
    const users = [
      {
        loginId: testUserLoginId[0],
        password: '!abc12345678',
        name: '測試用帳號',
        email: 'test@example.com',
      },
      {
        loginId: 'unique_login_id',
        password: '!abc12345678',
        name: '測試用帳號',
        email: testUserLoginId[0] + '@example.com',
      },
    ];  

    for (const u of users) {
      const res = await request(app.getHttpServer())
        .post('/users')
        .send(u)
        .expect(409);

      expect(res.body).toHaveProperty('statusCode', 409);
      expect(res.body).toHaveProperty('message');
    }
  });

  it('/users (GET) → get all of users', async () => {
    const res = await request(app.getHttpServer())
      .get('/users?page=1&limit=10')
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
  });

  it('/users (GET) → get users with filter and page', async () => {
    const res = await request(app.getHttpServer())
      .get('/users?page=1&limit=10')
      .send({ role: 'buyer', search: '測試用' })
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
  });

  it('/users/:id (GET) → get a single user by id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${testUserId[0]}`)
      .expect(200);

    expect(res.body).toHaveProperty('userId', testUserId[0]);
    expect(res.body.loginId).toBe(testUserLoginId[0]);
  });

  it('/users/:id (PATCH) → update integral user data', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${testUserId[0]}`)
      .send({ name: '更新後的名稱' })
      .expect(200);

    expect(res.body).toHaveProperty('userId', testUserId[0]);
    expect(res.body.name).toBe('更新後的名稱');
  });

  it('/users/:id (PATCH) → update partial user data', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${testUserId[1]}`)
      .send({ role: 'buyer' })
      .expect(200);
      
    expect(res.body).toHaveProperty('userId', testUserId[1]);
    expect(res.body.role).toBe('buyer');
  });

  it('PATCH /users/:id → update user data with conflict login id → 409', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${testUserId[1]}`)
      .send({ loginId: `${testUserLoginId[0]}` })
      .expect(409);

    expect(res.body).toHaveProperty('statusCode', 409);
    expect(res.body).toHaveProperty('message');
  });

  it('PATCH /users/:id → update user data with conflict email → 409', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${testUserId[2]}`)
      .send({ email: `${testUserLoginId[1]}@example.com` })
      .expect(409);

    expect(res.body).toHaveProperty('statusCode', 409);
    expect(res.body).toHaveProperty('message');
  });

  it('/users/:id (DELETE) → delete user by id', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/users/${testUserId[0]}`)
      .expect(200);

    expect(res.body).toHaveProperty('message', 'User deleted successfully');
  });
  
  it('/users/:id (DELETE) → delete user by deleted user id', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/users/${testUserId[0]}`)
      .expect(404);

    expect(res.body).toHaveProperty('message', `User with ID ${testUserId[0]} not found`);
  });

  it('/users/:id/restore (POST) → restore a deleted user by id', async () => {  
    const res = await request(app.getHttpServer())
      .post(`/users/${testUserId[0]}/restore`)
      .expect(201);

    expect(res.body).toHaveProperty('userId', testUserId[0]);
  });

  it('/users/deleted (GET) → get all of deleted users', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/deleted?page=1&limit=10')
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
  });

  it('/users/deleted (GET) → get deleted users with filter and page', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/deleted?page=1&limit=10')
      .send({ role: 'buyer', search: '測試用' })
      .expect(200);
      
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
  });

  it('/users/:id/permanent (DELETE) → permanently delete by id with non-permission', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        loginId: testUserLoginId[0],
        password: '!abc12345678',
      })
      .expect(201);

    let accessToken = loginRes.body.accessToken;

    const res = await request(app.getHttpServer())
      .delete(`/users/${testUserId[1]}/permanent`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    expect(res.body).toHaveProperty('message', 'Forbidden resource');
  });

  it('/users/:id/permanent (DELETE) → permanently delete user by id', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        loginId: testUserLoginId[2],
        password: '.abc12345678',
      })
      .expect(201);

    let accessToken = loginRes.body.accessToken;

    const res = await request(app.getHttpServer())
      .delete(`/users/${testUserId[0]}/permanent`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/users/${testUserId[1]}/permanent`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/users/${testUserId[2]}/permanent`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty(
      'message',
      'User permanently deleted successfully',
    );
  });

  it('/users/test/health (GET) → health check', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/test/health')
      .expect(200);

    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('module', 'users');
    expect(res.body).toHaveProperty('timestamp');
  });
});
