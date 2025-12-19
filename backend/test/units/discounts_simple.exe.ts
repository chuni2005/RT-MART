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


describe('DiscountsController (e2e)', () => {
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

    it(`/discounts (POST) → Create special discounts (seller's)`, async () => {

    });

    it(`/discounts/admin (POST) → Create discounts (admin's)`, async () => {

    });

    it(`/discounts (Get) → Find all discounts with filter (public)`, async () => {

    });

    it(`/discounts (Get) → Find all discounts with filter (public)`, async () => {

    });

    it(`teardown`, async () => {
        await UserDeleteTest.permanentlyDeleteUserById(app, buyerUser.userId);
        await UserDeleteTest.permanentlyDeleteUserById(app, sellerUser.userId);
        await UserDeleteTest.permanentlyDeleteUserById(app, adminUser.userId);
    });

});