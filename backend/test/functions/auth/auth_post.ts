import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { buyerUser, sellerUser, adminUser, adminTester } from '../../variables';

export async function registerUser(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      loginId: buyerUser.loginId,
      name: buyerUser.name,
      password: buyerUser.password,
      email: buyerUser.email,
      phone: buyerUser.phone,
    })
    .expect(201);

  buyerUser.userId =
    res.body.userId !== adminTester.userId ? res.body.userId : 0;
}

export async function registerUserWithConflict(
  app: INestApplication,
  loginId: string,
  email: string,
): Promise<void> {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      loginId: loginId,
      password: '!abc12345678',
      name: '測試用帳號',
      email: email,
    })
    .expect(409);

  expect(res.body).toHaveProperty('statusCode', 409);
  expect(res.body).toHaveProperty('message');
}

export async function loginUser(app: INestApplication, user: any) {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      loginId: user.loginId,
      password: user.password,
    })
    .expect(201);

  const cookies = res.headers['set-cookie'];
  const cookieString = Array.isArray(cookies) ? cookies.join(';') : cookies;
  expect(cookieString).toContain('refreshToken');
  expect(cookieString).toContain('accessToken');
  // console.log('Using cookies for login:', cookieString);
  user.cookie.accessToken =
    cookieString.match(/accessToken=([^;]+);/)?.[1] || '';
  user.cookie.refreshToken =
    cookieString.match(/refreshToken=([^;]+);/)?.[1] || '';
}

export async function loginUserWithInvalidCredentials(
  app: INestApplication,
  loginId: string,
  password: string,
): Promise<void> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      loginId: loginId,
      password: password,
    })
    .expect(401);

  expect(res.body).toHaveProperty('statusCode', 401);
  expect(res.body).toHaveProperty('message');
}

export async function refreshAccessTokenWithCookie(
  app: INestApplication,
  user: any,
): Promise<void> {
  // console.log(
  //   'Using cookies for refresh token:',
  //   buyerUser.cookie.refreshToken,
  // );
  const refreshRes = await request(app.getHttpServer())
    .post('/auth/refresh')
    .set('Cookie', `refreshToken=${user.cookie.refreshToken}`)
    .expect(201);
  const refreshCookies = refreshRes.headers['set-cookie'];
  const refreshCookieString = Array.isArray(refreshCookies)
    ? refreshCookies.join(';')
    : refreshCookies;
  expect(refreshCookieString).toContain('accessToken');
  user.cookie.accessToken =
    refreshCookieString.match(/accessToken=([^;]+);/)?.[1] || '';
}

export async function refreshAccessTokenWithWrongRefreshTokenInCookie(
  app: INestApplication,
): Promise<void> {
  const cookies = `refreshToken=invalid_refresh_token`;
  const res = await request(app.getHttpServer())
    .post('/auth/refresh')
    .set('Cookie', cookies)
    .expect(401);
}

export async function logoutUser(
  app: INestApplication,
  user: any,
): Promise<void> {
  const res = await request(app.getHttpServer())
    .post('/auth/logout')
    .set('Cookie', `refreshToken=${user.cookie.refreshToken}`)
    .expect(201);

  const logoutCookies = res.headers['set-cookie'] ?? [];
  const logoutCookieString = Array.isArray(logoutCookies)
    ? logoutCookies.join(';')
    : logoutCookies;

  user.cookie.accessToken =
    logoutCookieString.match(/accessToken=([^;]+);/)?.[1] || '';
  user.cookie.refreshToken =
    logoutCookieString.match(/refreshToken=([^;]+);/)?.[1] || '';
  expect(user.cookie.accessToken == '').toBe(true);
  expect(user.cookie.refreshToken == '').toBe(true);
}
