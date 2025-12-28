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
import * as StoreGetTest from './../functions/stores/stores_get';
import * as StorePatchTest from './../functions/stores/stores_patch';
import * as StoreDeleteTest from './../functions/stores/stores_delete';
import {
  buyerUser,
  sellerUser,
  adminUser,
  adminTester,
  buyerUser_sellerCase,
} from './../variables';
import { Seller } from '@/sellers/entities/seller.entity';
import { Console } from 'console';

describe('StoresController (e2e)', () => {
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
    await SellerPostTest.appplyOwnBuyerAccountToSellerRole(app, buyerUser);
    await SellerPostTest.verifyApplicationOfSeller(app, buyerUser);
    await SellerPostTest.appplyOwnBuyerAccountToSellerRole(
      app,
      buyerUser_sellerCase,
    );
    await SellerPostTest.verifyApplicationOfSeller(app, buyerUser_sellerCase);
    // Relogin token when users role changed
    await AuthPostTest.loginUser(app, buyerUser);
    await AuthPostTest.loginUser(app, buyerUser_sellerCase);
  }, 35000);

  it('/stores (GET) → Get stores', async () => {
    await StoreGetTest.getAllOfStores(app);
    await StoreGetTest.getStoresWithFilter(app);
  });

  it('/stores (PATCH) → Update store data', async () => {
    await StorePatchTest.updateOwnStoreData(app);
    await StorePatchTest.updateNonOwnStoreDataWithNonCookie(app);
    await StorePatchTest.updateStoreDataWithNonPermissionRole(app);
  });

  it('/stores (DELETE) → Delete store', async () => {
    await StoreDeleteTest.deleteOwnStore(app);
    await StoreDeleteTest.deleteStoreWithNonCookie(app);
    await StoreDeleteTest.deleteStoreWithNonPermissionRole(app);
  });

  it('/stores/:storeId (GET) → Get a single store', async () => {
    await StoreGetTest.getSingleStoreById(app);
    await StoreGetTest.getSingleStoreByDeletedStoreId(app);
    await StoreGetTest.getSingleStoreByNonExistentId(app);
  });

  it('/stores/restore (PATCH) → Restore store', async () => {
    await StorePatchTest.restoreStoreById(app);
    await StorePatchTest.restoreStoreByNonDeletedId(app);
    await StorePatchTest.restoreStoreWithNonCookie(app);
    await StorePatchTest.restoreStoreWithNonPermissionRole(app);
  });

  it('/stores/:storeId (DELETE) → Delete store', async () => {
    await StoreDeleteTest.deleteStoreById(app);
    await StoreDeleteTest.deleteStoreByDeletedStoreId(app);
    await StoreDeleteTest.deleteStoreByNonExistentId(app);
    await StoreDeleteTest.deleteStoreByIdWithNonCookie(app);
    await StoreDeleteTest.deleteStoreByIdWithNonPermissionRole(app);
  });

  it('/stores/:storeId/permanent (DELETE) → Permanently delete store', async () => {
    await StoreDeleteTest.permanentlyDeleteStoreById(app, buyerUser.storeId);
    await StoreDeleteTest.permanentlyDeleteStoreById(
      app,
      buyerUser_sellerCase.storeId,
    );
    await StoreDeleteTest.permanentlyDeleteStoreByNonExistentId(app);
    await StoreDeleteTest.permanentlyDeleteStoreByIdWithNonCookie(app);
    await StoreDeleteTest.permanentlyDeleteStoreByIdWithNonPermissionRole(app);
  });

  it('/stores/test/health (GET) → health check', async () => {
    await StoreGetTest.getHealthTest(app);
  });

  it('teardown', async () => {
    await UserDeleteTest.permanentlyDeleteUserById(app, buyerUser.userId);
    await UserDeleteTest.permanentlyDeleteUserById(
      app,
      buyerUser_sellerCase.userId,
    );
    await UserDeleteTest.permanentlyDeleteUserById(app, sellerUser.userId);
    await UserDeleteTest.permanentlyDeleteUserById(app, adminUser.userId);
  });
});
