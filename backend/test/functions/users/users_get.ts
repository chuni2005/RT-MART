import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { adminTester, buyerUser, sellerUser, adminUser } from '../../variables';

export async function getUsers(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .get('/users?page=1&limit=10')
    .expect(200);
  expect(res.body).toHaveProperty('data');
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body).toHaveProperty('total');
}

export async function getUsersWithFilter(
  app: INestApplication,
  role: string,
  search: string,
) {
  const res = await request(app.getHttpServer())
    .get(`/users?page=1&limit=10&role=${role}&search=${search}`)
    .expect(200);
  expect(res.body).toHaveProperty('data');
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body).toHaveProperty('total');
}

export async function getSingleUserById(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .get(`/users/${adminUser.userId}`)
    .expect(200);
  expect(res.body).toHaveProperty('loginId', adminUser.loginId);
  expect(res.body).toHaveProperty('name', adminUser.name);
  expect(res.body).toHaveProperty('email', adminUser.email);
  expect(res.body).toHaveProperty('role', adminUser.role);
}

export async function getSingleUserByDeletedUserId(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .get(`/users/${buyerUser.userId}`)
    .expect(404);
}

export async function getSingleUserByNonExistentId(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .get(`/users/10000`)
    .expect(404);
}

export async function getAllOfDeletedUser(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .get('/users/deleted?page=1&limit=10')
    .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
    .expect(200);
  expect(res.body).toHaveProperty('data');
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body).toHaveProperty('total');
}

export async function getDeletedUsersWithFilterAndPage(
  app: INestApplication,
  role: string,
  search: string,
) {
  const res = await request(app.getHttpServer())
    .get(`/users/deleted?page=1&limit=10&role=${role}&search=${search}`)
    .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
    .expect(200);
  expect(res.body).toHaveProperty('data');
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body).toHaveProperty('total');
}

export async function getAllOfDeletedUsersWithNonPermissionRole(
  app: INestApplication,
) {
  const res = await request(app.getHttpServer())
    .get(`/users/deleted?page=1&limit=10`)
    .set('Cookie', `accessToken=${sellerUser.cookie.accessToken}`)
    .expect(403);
}

export async function getHealthTest(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .get('/users/test/health')
    .expect(200);

  expect(res.body).toHaveProperty('status', 'ok');
  expect(res.body).toHaveProperty('module', 'users');
  expect(res.body).toHaveProperty('timestamp');
}
