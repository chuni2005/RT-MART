import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { adminTester, buyerUser, sellerUser, adminUser } from '../../variables';

export async function deleteOwnStore(app: INestApplication) {
  await request(app.getHttpServer())
    .delete(`/stores`)
    .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
    .expect(200);
}

export async function deleteStoreWithNonCookie(app: INestApplication) {
  await request(app.getHttpServer()).delete(`/stores`).expect(401);
}

export async function deleteStoreWithNonPermissionRole(app: INestApplication) {
  await request(app.getHttpServer())
    .delete(`/stores`)
    .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
    .expect(403);
}

export async function deleteStoreById(app: INestApplication) {
  await request(app.getHttpServer())
    .delete(`/stores/${buyerUser.storeId}`)
    .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
    .expect(200);
}

export async function deleteStoreByDeletedStoreId(app: INestApplication) {
  await request(app.getHttpServer())
    .delete(`/stores/${buyerUser.storeId}`)
    .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
    .expect(404);
}

export async function deleteStoreByNonExistentId(app: INestApplication) {
  await request(app.getHttpServer())
    .delete(`/stores/10000`)
    .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
    .expect(404);
}

export async function deleteStoreByIdWithNonCookie(app: INestApplication) {
  await request(app.getHttpServer())
    .delete(`/stores/${buyerUser.storeId}`)
    .expect(401);
}

export async function deleteStoreByIdWithNonPermissionRole(
  app: INestApplication,
) {
  await request(app.getHttpServer())
    .delete(`/stores/${buyerUser.storeId}`)
    .set('Cookie', `accessToken=${sellerUser.cookie.accessToken}`)
    .expect(403);
}

export async function permanentlyDeleteStoreById(
  app: INestApplication,
  storeId: Number,
) {
  const response = await request(app.getHttpServer())
    .delete(`/stores/${storeId}/permanent`)
    .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
    .expect(200);
}

export async function permanentlyDeleteStoreByNonExistentId(
  app: INestApplication,
) {
  await request(app.getHttpServer())
    .delete(`/stores/10000/permanent`)
    .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
    .expect(404);
}

export async function permanentlyDeleteStoreByIdWithNonCookie(
  app: INestApplication,
) {
  await request(app.getHttpServer())
    .delete(`/stores/${buyerUser.storeId}/permanent`)
    .expect(401);
}

export async function permanentlyDeleteStoreByIdWithNonPermissionRole(
  app: INestApplication,
) {
  await request(app.getHttpServer())
    .delete(`/stores/${buyerUser.storeId}/permanent`)
    .set('Cookie', `accessToken=${sellerUser.cookie.accessToken}`)
    .expect(403);
}
