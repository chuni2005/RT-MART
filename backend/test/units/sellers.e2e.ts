import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModules } from './../module.index';
import { createTestApp } from './../functions/e2e';
import * as AuthPostTest from './../functions/auth/auth_post';
import * as UserPostTest from './../functions/users/users_post';
import * as UserDeleteTest from './../functions/users/users_delete';
import * as SellerPostTest from './../functions/sellers/sellers_post';
import * as SellerDeleteTest from './../functions/sellers/sellers_delete';
import * as SellerGetTest from './../functions/sellers/sellers_get';
import { buyerUser, sellerUser, adminUser, adminTester, buyerUser_sellerCase } from './../variables';

describe('SellerController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  }, 15000);

  afterAll(async () => {
    await app.close();
  });

  it('setup', async () => {
    await AuthPostTest.loginUser(app, adminTester);
    await UserPostTest.createUser(app, buyerUser);
    await UserPostTest.createUser(app, buyerUser_sellerCase);
    await UserPostTest.createUser(app, sellerUser);
    await UserPostTest.createUser(app, adminUser);
    await AuthPostTest.loginUser(app, buyerUser);
    await AuthPostTest.loginUser(app, buyerUser_sellerCase);
    await AuthPostTest.loginUser(app, sellerUser);
    await AuthPostTest.loginUser(app, adminUser);
  }, 25000);

  it('/sellers (POST) → Apply to upgrade to seller', async () => {
    await SellerPostTest.appplyOwnBuyerAccountToSellerRole(app);
    await SellerPostTest.appplyOwnSellerAccountToSellerRole(app);
    await SellerPostTest.appplyOwnAdminAccountToSellerRole(app);
    await SellerPostTest.appplyOwnSellerAccountToSellerRoleWithNonCookie(app);
  });

  it('/sellers (GET) → Get sellers', async () => {
    await SellerGetTest.getAllSellers(app);
    await SellerGetTest.getSellersWithFillter(app);
    await SellerGetTest.getSellersWithNonPermissionRole(app);
  });

  it('/sellers:sellerId (GET) → Get single seller', async () => {
    await SellerGetTest.getSingleSellerById(app);
    await SellerGetTest.getSingleSellerByNonExistentId(app);
    await SellerGetTest.getSingleSellerWithNonPermissionRole(app);
  });

  it('/sellers:sellerId/verify (POST) → Verify application of seller', async () => {
    await SellerPostTest.verifyApplicationOfSeller(app);
    await SellerPostTest.verifyApplicationOfVerifiedSeller(app);
    await SellerPostTest.verifyApplicationOfNonExistedSeller(app);
    await SellerPostTest.verifyApplicationOfSellerWithNonPermissionRole(app);
  });

  it('/sellers:sellerId (DELETE) → Delete seller', async () => {
    await SellerDeleteTest.deleteUnverifiedSellerBySellerId(app);
    await SellerDeleteTest.deleteVerifiedSellerBySellerId(app);
    await SellerDeleteTest.deleteSellerWithNonExistedSeller(app);
    await SellerDeleteTest.deleteSellerWithNonPermissionRole(app);
  });

  it('/users/test/health (GET) → health check', async () => {
    await SellerGetTest.getHealthTest(app);
  });

  it('teardown', async () => {
    //stores delete api will delete sellers together
    await request(app.getHttpServer())
      .delete(`/stores/${buyerUser.storeId}/permanent`)
      .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
      .expect(200);
    await UserDeleteTest.permanentlyDeleteUserById(app, buyerUser.userId);
    await UserDeleteTest.permanentlyDeleteUserById(app, buyerUser_sellerCase.userId);
    await UserDeleteTest.permanentlyDeleteUserById(app, sellerUser.userId);
    await UserDeleteTest.permanentlyDeleteUserById(app, adminUser.userId);
  });

});