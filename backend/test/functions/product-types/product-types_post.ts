import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { adminTester, buyerUser, sellerUser, adminUser, productType, productTypeWithParent } from '../../variables';

export async function createProductTypeWithAdminRole(app: INestApplication) {
    const res = await request(app.getHttpServer())
        .post(`/product-types`)
        .send({
            typeCode: productType.typeCode,
            typeName: productType.typeName,
            parentTypeId: productType.parentTypeId,
            isActive: productType.isActive
        })
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(201);
    expect(res.body).toHaveProperty('productTypeId');
    productType.productTypeId = res.body.productTypeId;
}

export async function createProductTypeWithParentTypeIdAndAdminRole(app: INestApplication) {
    const res = await request(app.getHttpServer())
        .post(`/product-types`)
        .send({
            typeCode: productTypeWithParent.typeCode,
            typeName: productTypeWithParent.typeName,
            isActive: productTypeWithParent.isActive
        })
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(201);
    expect(res.body).toHaveProperty('productTypeId');
    productTypeWithParent.productTypeId = res.body.productTypeId;
}

export async function createProductTypeWithNonExistentParentTypeIdAndAdminRole(app: INestApplication) {
    await request(app.getHttpServer())
        .post(`/product-types`)
        .send({
            typeCode: 'testCode_nonExistentParent',
            typeName: 'testName nonExistentParent',
            parentTypeId: -1,
            isActive: true,
        })
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(404);
}

export async function createProductTypeWithNonPermissionRole(app: INestApplication) {
    await request(app.getHttpServer())
        .post(`/product-types`)
        .send({
            typeCode: productType.typeCode,
            typeName: productType.typeName,
            isActive: productType.isActive
        })
        .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
        .expect(403);
}