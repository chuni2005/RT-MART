import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { adminTester, buyerUser, sellerUser, adminUser, productType, productTypeWithParent } from '../../variables';
import * as productTypePostTest from './product-types_post';

export async function deleteProductTypeByIdWithAdminRole(app: INestApplication) {
    await request(app.getHttpServer())
        .delete(`/product-types/${productType.productTypeId}`)
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(200);
    await request(app.getHttpServer())
        .delete(`/product-types/${productTypeWithParent.productTypeId}`)
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(200);
}

export async function deleteProductTypeWithNonExistentIdWithAdminRole(app: INestApplication) {
    await request(app.getHttpServer())
        .delete(`/product-types/10000`)
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(404);
}

export async function deleteProductTypeWithNonPermissionRole(app: INestApplication) {
    await request(app.getHttpServer())
        .delete(`/product-types/${productType.productTypeId}`)
        .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
        .expect(403);
}