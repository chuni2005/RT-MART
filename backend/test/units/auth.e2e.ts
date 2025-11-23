import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModules } from './../module.index';
import { createTestApp } from './../functions/e2e';
import * as AuthPostTest from './../functions/auth/auth_post';
import * as AuthGetTest from './../functions/auth/auth_get';
import { buyerUser, sellerUser, adminUser } from './../variables';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  }, 1000);

  afterAll(async () => {
    await app.close();
  });

  it('/register (POST) → User register', async () => {
    await AuthPostTest.registerUser(app);
    await AuthPostTest.registerUserWithConflict(app, buyerUser.loginId, 'unique_email@example.com');
    await AuthPostTest.registerUserWithConflict(app, 'unique_loginId', buyerUser.email);
  });

  it('/login (POST) → User login', async () => {
    await AuthPostTest.loginUser(app);
    await AuthPostTest.loginUserWithInvalidCredentials(app, buyerUser.loginId, 'wrongpassword');
    await AuthPostTest.loginUserWithInvalidCredentials(app, 'wrongloginId', buyerUser.password);
  });

  it('/register (POST) → Refresh access token', async () => {
    await AuthPostTest.refreshAccessTokenWithCookie(app);
    await AuthPostTest.refreshAccessTokenWithWrongRefreshTokenInCookie(app);
  });

  it('/profile (GET) → Get profile', async () => {
    await AuthGetTest.getUserProfile(app);
    await AuthGetTest.getUserProfileWithWrongAccessTokenCookie(app);
  });

  it ('/logout (POST) → User logout', async () => {
    await AuthPostTest.logoutUser(app);
  });

  it('/auth/test/health (GET) → health check', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/test/health')
      .expect(200);

    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('module', 'auth');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('teardown', async () => {
    //login buyer
    //delete buyer with user-api
  });
});