import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { adminTester, buyerUser, sellerUser, adminUser, productType, productTypeWithParent } from '../../variables';

export async function updateProductTypeByIdWithAdminRole(app: INestApplication){
    const res =  await request(app.getHttpServer())
        .patch(`/product-types/${productType.productTypeId}`)
        .send({ typeName: 'updatedTypeName', typeCode: 'updatedTypeCode' })
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(200);
    expect(res.body.typeName).toBe('updatedTypeName');
    expect(res.body.typeCode).toBe('updatedTypeCode');
    
    await request(app.getHttpServer())
        .patch(`/product-types/${productTypeWithParent.productTypeId}`)
        .send({ isActive: false })
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(200);
}

export async function updateProductTypeWithNonExistentIdWithAdminRole(app: INestApplication){
    await request(app.getHttpServer())
        .patch(`/product-types/10000`)
        .send({ typeName: 'updatedTypeName', typeCode: 'updatedTypeCode' })
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(404);
}

export async function updateProductTypeWithNonPermissionRole(app: INestApplication){
    await request(app.getHttpServer())
        .patch(`/product-types/${productType.productTypeId}`)
        .send({ typeName: 'updatedTypeName', typeCode: 'updatedTypeCode' })
        .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
        .expect(403);
}