import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  adminTester,
  buyerUser,
  sellerUser,
  adminUser,
  buyerUser_sellerCase,
} from '../../variables';

export async function updateOwnStoreData(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .patch(`/stores`)
    .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
    .send({
      storeName: 'Updated Store Name',
      description: 'Updated store description',
    })
    .expect(200);
  expect(res.body).toHaveProperty('storeId', buyerUser.storeId);
  expect(res.body).toHaveProperty('description', 'Updated store description');
}

export async function updateNonOwnStoreDataWithNonCookie(
  app: INestApplication,
) {
  await request(app.getHttpServer())
    .patch(`/stores`)
    .send({
      storeName: 'Hacked Store Name',
      description: 'Hacked store description',
    })
    .expect(401);
}

export async function updateStoreDataWithNonPermissionRole(
  app: INestApplication,
) {
  await request(app.getHttpServer())
    .patch(`/stores`)
    .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
    .send({
      storeName: 'Hacked Store Name',
      description: 'Hacked store description',
    })
    .expect(403);
}

export async function restoreStoreById(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .patch(`/stores/${buyerUser.storeId}`)
    .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
    .expect(200);
  expect(res.body).toHaveProperty('storeId', buyerUser.storeId);
}

export async function restoreStoreByNonDeletedId(app: INestApplication) {
  await request(app.getHttpServer())
    .patch(`/stores/${buyerUser_sellerCase.storeId}`)
    .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
    .expect(400);
}

export async function restoreStoreWithNonCookie(app: INestApplication) {
  await request(app.getHttpServer())
    .patch(`/stores/${buyerUser.storeId}`)
    .expect(401);
}

export async function restoreStoreWithNonPermissionRole(app: INestApplication) {
  await request(app.getHttpServer())
    .patch(`/stores/${buyerUser.storeId}`)
    .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
    .expect(403);
}
