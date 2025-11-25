import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { buyerUser, sellerUser, adminUser } from '../../variables';

export async function registerUser(app: INestApplication) {
    await request(app.getHttpServer())
        .post('/auth/register')
        .send({
            loginId: buyerUser.loginId,
            name: buyerUser.name,
            password: buyerUser.password,
            email: buyerUser.email,
            phone: buyerUser.phone,
        })
        .expect(201);
}

export async function registerUserWithConflict(app: INestApplication, loginId: string, email: string): Promise<void> {
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

export async function loginUser(app: INestApplication) {
    const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
            loginId: buyerUser.loginId,
            password: buyerUser.password,
        })
        .expect(201);

    const cookies = res.headers['set-cookie'];
    const cookieString = Array.isArray(cookies) ? cookies.join(';') : cookies;
    expect(cookieString).toContain('refreshToken');
    expect(cookieString).toContain('accessToken');
    console.log('Using cookies for login:', cookieString);
    buyerUser.cookie.accessToken = cookieString.match(/accessToken=([^;]+);/)?.[1] || '';
    buyerUser.cookie.refreshToken = cookieString.match(/refreshToken=([^;]+);/)?.[1] || '';
}

export async function loginUserWithInvalidCredentials(app: INestApplication, loginId: string, password: string): Promise<void> {
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

export async function refreshAccessTokenWithCookie(app: INestApplication) {
    console.log('Using cookies for refresh token:', buyerUser.cookie.refreshToken);
    const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', `refreshToken=${buyerUser.cookie.refreshToken}`)
        .expect(201);
    const refreshCookies = refreshRes.headers['set-cookie'];
    const refreshCookieString = Array.isArray(refreshCookies) ? refreshCookies.join(';') : refreshCookies;
    expect(refreshCookieString).toContain('accessToken');
}

export async function refreshAccessTokenWithWrongRefreshTokenInCookie(app: INestApplication): Promise<void> {
    const cookies = `refreshToken=invalid_refresh_token`;
    const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(401);
}

export async function logoutUser(app: INestApplication): Promise<void> {
    const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', `refreshToken=${buyerUser.cookie.refreshToken}`)
        .expect(201);
    
    const logoutCookies = res.headers['set-cookie'] ?? [];
    const logoutCookieString = Array.isArray(logoutCookies)
        ? logoutCookies.join(';')
        : logoutCookies;

    buyerUser.cookie.accessToken = logoutCookieString.match(/accessToken=([^;]+);/)?.[1] || '';
    buyerUser.cookie.refreshToken = logoutCookieString.match(/refreshToken=([^;]+);/)?.[1] || '';
    expect(buyerUser.cookie.accessToken == '').toBe(true);
    expect(buyerUser.cookie.refreshToken == '').toBe(true);
}
