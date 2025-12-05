import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { buyerUser, sellerUser, adminUser, adminTester } from '../../variables';

export async function deleteOwnAccount(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .delete(`/users/me`)
    .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
    .expect(200);
}

export async function deleteOwnAccountWithNonCookie(app: INestApplication) {
  await request(app.getHttpServer()).delete(`/users/me`).expect(401);
}

export async function deleteUserById(app: INestApplication) {
  await request(app.getHttpServer())
    .delete(`/users/${sellerUser.userId}`)
    .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
    .expect(200);
}

export async function deleteUserWithDeletedUserId(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .delete(`/users/'${buyerUser.userId}`)
    .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
    .expect(404);
}

export async function deleteUserWithNonExistentId(app: INestApplication) {
  await request(app.getHttpServer())
    .delete(`/users/10000`)
    .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
    .expect(404);
}

export async function deleteUserWithNonPermissionRole(app: INestApplication) {
  await request(app.getHttpServer())
    .delete(`/users/${adminUser.userId}`)
    .set('Cookie', `accessToken=${sellerUser.cookie.accessToken}`)
    .expect(403);
}

export async function permanentlyDeleteUserById(
  app: INestApplication,
  userId: number,
) {
  await request(app.getHttpServer())
    .delete(`/users/${userId}/permanent`)
    .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
    .expect(200);
}

export async function permanentlyDeleteUserByDeletedId(app: INestApplication) {
  await request(app.getHttpServer())
    .delete(`/users/${buyerUser.userId}/permanent`)
    .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
    .expect(404);
}

export async function permanentlyDeleteUserByNonExitedId(
  app: INestApplication,
) {
  await request(app.getHttpServer())
    .delete(`/users/10000/permanent`)
    .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
    .expect(404);
}

export async function permanentlyDeleteUserByIdWithNonPermissionRole(
  app: INestApplication,
) {
  await request(app.getHttpServer())
    .delete(`/users/${sellerUser.userId}/permanent`)
    .set('Cookie', `accessToken=${sellerUser.cookie.accessToken}`)
    .expect(403);
}
