import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModules } from './../module.index';
import { createTestApp } from './../functions/e2e';
import * as AuthPostTest from './../functions/auth/auth_post';
import * as AuthGetTest from './../functions/auth/auth_get';
import { permanentlyDeleteUserById } from './../functions/users/users_delete';
import { buyerUser, sellerUser, adminUser, adminTester } from './../variables';
import { buildMessage } from 'class-validator';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  }, 15000);

  afterAll(async () => {
    await app.close();
  });

  it('setup', async () =>{
    await AuthPostTest.loginUser(app, adminTester);
  })

  it('/register (POST) → User register', async () => {
    await AuthPostTest.registerUser(app);
    await AuthPostTest.registerUserWithConflict(
      app,
      buyerUser.loginId,
      'unique_email@example.com',
    );
    await AuthPostTest.registerUserWithConflict(
      app,
      'unique_loginId',
      buyerUser.email,
    );
  });

  it('/login (POST) → User login', async () => {
    await AuthPostTest.loginUser(app, buyerUser);
    await AuthPostTest.loginUserWithInvalidCredentials(
      app,
      buyerUser.loginId,
      'wrongpassword',
    );
    await AuthPostTest.loginUserWithInvalidCredentials(
      app,
      'wrongloginId',
      buyerUser.password,
    );
  });

  it('/register (POST) → Refresh access token', async () => {
    await AuthPostTest.refreshAccessTokenWithCookie(app, buyerUser);
    await AuthPostTest.refreshAccessTokenWithWrongRefreshTokenInCookie(app);
  });

  it('/profile (GET) → Get profile', async () => {
    await AuthGetTest.getUserProfile(app);
    await AuthGetTest.getUserProfileWithWrongAccessTokenCookie(app);
  });

  it('/logout (POST) → User logout', async () => {
    await AuthPostTest.logoutUser(app, buyerUser);
  });

  it('/auth/test/health (GET) → health check', async () => {
    await AuthGetTest.getHealthTest(app);
  });

  it('teardown', async () => {
    await permanentlyDeleteUserById(app, buyerUser.userId);
    await AuthPostTest.logoutUser(app, adminTester);
    // console.log(buyerUser);
  });
});
