import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModules } from './../module.index';
import { createTestApp } from './../functions/e2e';
import * as AuthPostTest from './../functions/auth/auth_post';
import * as UserPostTest from './../functions/users/users_post';
import * as UserDeleteTest from './../functions/users/users_delete';
import * as ProductTypesDeleteTest from './../functions/product-types/product-types_delete';
import * as ProductTypesPostTest from './../functions/product-types/product-types_post';
import * as ProductTypesPatchTest from './../functions/product-types/product-types_patch';
import * as ProductTypesGetTest from './../functions/product-types/product-types_get';
import * as SellerGetTest from './../functions/sellers/sellers_get';
import { buyerUser, sellerUser, adminUser, adminTester, buyerUser_sellerCase } from './../variables';


describe('ProductTypesController (e2e)', () => {
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
    await UserPostTest.createUser(app, sellerUser);
    await UserPostTest.createUser(app, adminUser);
    await AuthPostTest.loginUser(app, buyerUser);
    await AuthPostTest.loginUser(app, sellerUser);
    await AuthPostTest.loginUser(app, adminUser);
  }, 25000);

  it(`/product-types (POST) → Create product type`, async () => {
    await ProductTypesPostTest.createProductTypeWithAdminRole(app);
    await ProductTypesPostTest.createProductTypeWithParentTypeIdAndAdminRole(app);
    await ProductTypesPostTest.createProductTypeWithNonExistentParentTypeIdAndAdminRole(app);
    await ProductTypesPostTest.createProductTypeWithNonPermissionRole(app);
  });

  it(`/product-types (GET) → Get product types (public)`, async () => {
    await ProductTypesGetTest.getAllProductTypes(app);
    await ProductTypesGetTest.getProductTypesWithFilter(app);
  });

  it(`/product-types (GET) → Get product types (admin's)`, async () => {
    await ProductTypesGetTest.getAllProductTypesWithAdminRole(app);
    await ProductTypesGetTest.getProductTypesWithFilterWithAdminRole(app);
    await ProductTypesGetTest.getProductTypesWithNonPermissionRole(app);
  });

  it(`/product-types/:productTypeId (PATCH) → Update product type data (admin's)`, async () => {
    await ProductTypesPatchTest.updateProductTypeByIdWithAdminRole(app);
    await ProductTypesPatchTest.updateProductTypeWithNonExistentIdWithAdminRole(app);
    await ProductTypesPatchTest.updateProductTypeWithNonPermissionRole(app);
  });

  it(`/product-types/:productTypeId (GET) → Get a single product type (public)`, async () => {
    await ProductTypesGetTest.getSingleProductTypeById(app);
    await ProductTypesGetTest.getSingleProductTypeByNonExistentId(app);
    await ProductTypesGetTest.getSingleProductTypeWithNonActiveId(app);
  });

  it(`/product-types/:productTypeId (GET) → Get a single product type (admin's)`, async () => {
    await ProductTypesGetTest.getSingleProductTypeByIdWithAdminRole(app);
    await ProductTypesGetTest.getSingleProductTypeByNonExistentIdWithAdminRole(app);
    await ProductTypesGetTest.getSingleProductTypeWithNonPermissionRole(app);
  });
  
  it(`/product-types/:productTypeId (DELETE) → Delete product type (admin's)`, async () => {
    await ProductTypesDeleteTest.deleteProductTypeByIdWithAdminRole(app);
    await ProductTypesDeleteTest.deleteProductTypeWithNonExistentIdWithAdminRole(app);
    await ProductTypesDeleteTest.deleteProductTypeWithNonPermissionRole(app);
  });

  it('/product-types/test/health (GET) → health check', async () => {
    await ProductTypesGetTest.getHealthTest(app);
  });

  it(`teardown`, async () => {
    await UserDeleteTest.permanentlyDeleteUserById(app, buyerUser.userId);
    await UserDeleteTest.permanentlyDeleteUserById(app, sellerUser.userId);
    await UserDeleteTest.permanentlyDeleteUserById(app, adminUser.userId);
  });

});