import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModules } from './../module.index';
import { createTestApp } from './../functions/e2e';
import * as AuthPostTest from './../functions/auth/auth_post';
import * as UserPostTest from './../functions/users/users_post';
import * as UserPatchTest from './../functions/users/users_patch';
import * as UserDeleteTest from './../functions/users/users_delete';
import * as UserGetTest from './../functions/users/users_get';
import { buyerUser, sellerUser, adminUser, adminTester } from './../variables';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  }, 15000);

  afterAll(async () => {
    await app.close();
  });

  it('setup', async () => {
    await AuthPostTest.loginUser(app, adminTester);
    // console.log(adminTester.cookie.accessToken);
  });

  it('/users (POST) → Create user', async () => {
    await UserPostTest.createUser(app, buyerUser);
    await UserPostTest.createUser(app, sellerUser);
    await UserPostTest.createUser(app, adminUser);
    await UserPostTest.createUserWithConflict(app, buyerUser.loginId, 'unique_email@example.com');
    await UserPostTest.createUserWithConflict(app, 'unique_login_id', buyerUser.email);
  });

  it('/users (GET) → Get users', async () => {
    await UserGetTest.getUsers(app);
    await UserGetTest.getUsersWithFilter(app, 'buyer', 'Test');
  });

  it('/users/me (PATCH) → Update own data', async () => {
    await UserPatchTest.updateIntegralOwnData(app);
    await UserPatchTest.updatePartialOwnData(app);
    await UserPatchTest.updateOwnDataWithConflictLoginId(app);
    await UserPatchTest.updateOwnDataWithConflictEmail(app);
    await UserPatchTest.updateOwnDataWithNonCookie(app);
  });

  it('/users/:id (PATCH) → Update user data', async () => {
    await UserPatchTest.updateIntegralUserData(app);
    await UserPatchTest.updatePartialUserData(app);
    await UserPatchTest.updateUserDataWithConflictLoginId(app);
    await UserPatchTest.updateUserDataWithConflictEmail(app);
    await UserPatchTest.updateUserDataWithNonPermissionRole(app);
  });

  it('/user/me (DELETE) → Delete own account', async () => {
    await UserDeleteTest.deleteOwnAccount(app);
    await UserDeleteTest.deleteOwnAccountWithNonCookie(app);
  })

  it('/user/:id (DELETE) → Delete user', async () => {
    await UserDeleteTest.deleteUserById(app);
    await UserDeleteTest.deleteUserWithDeletedUserId(app);
    await UserDeleteTest.deleteUserWithNonExistentId(app);
    await UserDeleteTest.deleteUserWithNonPermissionRole(app);
  })

  it('/users/:id (GET) → get a single user by id', async () => {
    await UserGetTest.getSingleUserById(app);
    await UserGetTest.getSingleUserByDeletedUserId(app);
    await UserGetTest.getSingleUserByNonExistentId(app);
  })

  it('/users/deleted (GET) → Get deleted users', async () => {
    await UserGetTest.getAllOfDeletedUser(app);
    await UserGetTest.getDeletedUsersWithFilterAndPage(app, 'buyer', 'user'),
      await UserGetTest.getAllOfDeletedUsersWithNonPermissionRole(app);
  });

  it('/users/:id/restore (POST) → restore a deleted user by id', async () => {
    await UserPostTest.restoreDeletedUserById(app);
    await UserPostTest.restoreNonDeletedUserById(app);
    await UserPostTest.restoreDeletedUserByNonExistentId(app);
    await UserPostTest.restoreDeletedUserWithNonPermissionRole(app);
  });

  it('/users/:id/permanent (DELETE) → permanently delete by id', async () => {
    await UserDeleteTest.permanentlyDeleteUserById(app, buyerUser.userId);
    await UserDeleteTest.permanentlyDeleteUserByDeletedId(app);
    await UserDeleteTest.permanentlyDeleteUserByNonExitedId(app);
    await UserDeleteTest.permanentlyDeleteUserByIdWithNonPermissionRole(app);
  });

  it('/users/test/health (GET) → health check', async () => {
    await UserGetTest.getHealthTest(app);
  });

  it('teardown', async () => {
    await UserDeleteTest.permanentlyDeleteUserById(app, sellerUser.userId);
    await UserDeleteTest.permanentlyDeleteUserById(app, adminUser.userId);
    // console.log(buyerUser);
  });
});