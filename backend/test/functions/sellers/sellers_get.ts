import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { adminTester, buyerUser, sellerUser, adminUser } from '../../variables';

export async function getAllSellers(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .get('/sellers?page=1&limit=10')
    .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
    .expect(200);
  expect(res.body).toHaveProperty('data');
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body).toHaveProperty('total');
}

export async function getSellersWithFillter(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .get(
      `/sellers?page=1&limit=10&userId=${buyerUser.userId}&verified=${false}`,
    )
    .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
    .expect(200);
  expect(res.body).toHaveProperty('data');
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body).toHaveProperty('total');
}

export async function getSellersWithNonPermissionRole(app: INestApplication) {
  await request(app.getHttpServer())
    .get('/sellers?page=1&limit=10')
    .set('Cookie', `accessToken=${sellerUser.cookie.accessToken}`)
    .expect(403);
}

export async function getSingleSellerById(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .get(`/sellers/${buyerUser.sellerId}`)
    .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
    .expect(200);
  expect(res.body).toHaveProperty('sellerId');
  expect(res.body).toHaveProperty('user');
  expect(res.body.user).toHaveProperty('loginId', buyerUser.loginId);
}

export async function getSingleSellerByNonExistentId(app: INestApplication) {
  await request(app.getHttpServer())
    .get(`/sellers/10000`)
    .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
    .expect(404);
}

export async function getSingleSellerWithNonPermissionRole(
  app: INestApplication,
) {
  await request(app.getHttpServer())
    .get(`/sellers/${buyerUser.sellerId}`)
    .set('Cookie', `accessToken=${sellerUser.cookie.accessToken}`)
    .expect(403);
}

export async function getHealthTest(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .get('/sellers/test/health')
    .expect(200);
  expect(res.body).toHaveProperty('status', 'ok');
  expect(res.body).toHaveProperty('module', 'sellers');
  expect(res.body).toHaveProperty('timestamp');
}
