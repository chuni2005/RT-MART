import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { adminTester, buyerUser, sellerUser, adminUser, productType, productTypeWithParent } from '../../variables';

export async function getAllProductTypes(app: INestApplication) {
    await request(app.getHttpServer())
        .get(`/product-types`)
        .set('Cookie', `accessToken=${sellerUser.cookie.accessToken}`)
        .expect(200);
}

export async function getProductTypesWithFilter(app: INestApplication) {
    const res = await request(app.getHttpServer())
        .get(`/product-types`)
        .query({ typeName: 'test', typeCode: 'test' })
        .set('Cookie', `accessToken=${sellerUser.cookie.accessToken}`)
        .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
}

export async function getAllProductTypesWithAdminRole(app: INestApplication) {
    await request(app.getHttpServer())
        .get(`/product-types/admin`)
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(200);
}

export async function getProductTypesWithFilterWithAdminRole(app: INestApplication) {
    const res = await request(app.getHttpServer())
        .get(`/product-types/admin`)
        .query({ typeName: 'test', typeCode: 'test' })
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
}

export async function getProductTypesWithNonPermissionRole(app: INestApplication) {
    const res = await request(app.getHttpServer())
        .get(`/product-types/admin`)
        .query({ typeName: 'test', typeCode: 'test' })
        .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
        .expect(403);
}

export async function getSingleProductTypeById(app: INestApplication) {
    await request(app.getHttpServer())
        .get(`/product-types/${productType.productTypeId}`)
        .set('Cookie', `accessToken=${sellerUser.cookie.accessToken}`)
        .expect(200);
}

export async function getSingleProductTypeByNonExistentId(app: INestApplication) {
    await request(app.getHttpServer())
        .get(`/product-types/10000`)
        .set('Cookie', `accessToken=${sellerUser.cookie.accessToken}`)
        .expect(404);
}

export async function getSingleProductTypeWithNonActiveId(app: INestApplication) {
    await request(app.getHttpServer())
        .get(`/product-types/${productTypeWithParent.productTypeId}`)
        .set('Cookie', `accessToken=${sellerUser.cookie.accessToken}`)
        .expect(404);
}

export async function getSingleProductTypeByIdWithAdminRole(app: INestApplication) {
    await request(app.getHttpServer())
        .get(`/product-types/admin/${productType.productTypeId}`)
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(200);
}

export async function getSingleProductTypeByNonExistentIdWithAdminRole(app: INestApplication) {
    await request(app.getHttpServer())
        .get(`/product-types/admin/10000`)
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(404);
}

export async function getSingleProductTypeWithNonPermissionRole(app: INestApplication) {
    await request(app.getHttpServer())
        .get(`/product-types/admin/${productType.productTypeId}`)
        .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
        .expect(403);
}

export async function getHealthTest(app: INestApplication) {
    await request(app.getHttpServer())
        .get(`/product-types/test/health`)
        .expect(200);
}