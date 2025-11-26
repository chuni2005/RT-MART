import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { refreshAccessTokenWithCookie } from './../auth/auth_post';
import { buyerUser, sellerUser, adminUser, adminTester } from '../../variables';

export async function updateIntegralOwnData(app: INestApplication) {
    // main
    const res = await request(app.getHttpServer())
        .patch(`/users/me`)
        .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
        .send({
            loginId: 'edited_userId',
            name: '更改後的名稱',
            password: '12345678*',
            email: 'edited_email@example.com',
            phone: '0987654321'
        })
        .expect(200);
    expect(res.body).toHaveProperty('userId', buyerUser.userId);
    expect(res.body.loginId).toBe('edited_userId');
    expect(res.body.name).toBe('更改後的名稱');
    expect(res.body.email).toBe('edited_email@example.com');
    expect(res.body.phone).toBe('0987654321');

    // relogin test
    const login_res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
            loginId: 'edited_userId',
            password: '12345678*',
        })
        .expect(201);
    const cookies = login_res.headers['set-cookie'];
    const cookieString = Array.isArray(cookies) ? cookies.join(';') : cookies;
    expect(cookieString).toContain('refreshToken');
    expect(cookieString).toContain('accessToken');
    buyerUser.cookie.accessToken = cookieString.match(/accessToken=([^;]+);/)?.[1] || '';
    buyerUser.cookie.refreshToken = cookieString.match(/refreshToken=([^;]+);/)?.[1] || '';

    // reset
    await request(app.getHttpServer())
        .patch(`/users/me`)
        .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
        .send({
            loginId: buyerUser.loginId,
            password: buyerUser.password,
        })
        .expect(200);
}

export async function updatePartialOwnData(app: INestApplication) {
    // main
    const res = await request(app.getHttpServer())
        .patch(`/users/me`)
        .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
        .send({
            name: '更改後的名稱',
            password: '12345678*',
        })
        .expect(200);
    expect(res.body).toHaveProperty('userId', buyerUser.userId);
    expect(res.body.name).toBe('更改後的名稱');

    // relogin test
    const relogin_res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
            loginId: buyerUser.loginId,
            password: '12345678*',
        })
        .expect(201);
    const cookies = relogin_res.headers['set-cookie'];
    const cookieString = Array.isArray(cookies) ? cookies.join(';') : cookies;
    expect(cookieString).toContain('refreshToken');
    expect(cookieString).toContain('accessToken');
    buyerUser.cookie.accessToken = cookieString.match(/accessToken=([^;]+);/)?.[1] || '';
    buyerUser.cookie.refreshToken = cookieString.match(/refreshToken=([^;]+);/)?.[1] || '';

    // reset
    await request(app.getHttpServer())
        .patch(`/users/me`)
        .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
        .send({
            name: buyerUser.name,
            password: buyerUser.password,
        })
        .expect(200);
}

export async function updateOwnDataWithConflictLoginId(app: INestApplication) {
    await request(app.getHttpServer())
        .patch(`/users/me`)
        .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
        .send({
            loginId: sellerUser.loginId,
        })
        .expect(409);
}

export async function updateOwnDataWithConflictEmail(app: INestApplication) {
    await request(app.getHttpServer())
        .patch(`/users/me`)
        .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
        .send({
            email: sellerUser.email,
        })
        .expect(409);
}

export async function updateOwnDataWithNonCookie(app: INestApplication) {
    await request(app.getHttpServer())
        .patch(`/users/me`)
        .send({
            email: sellerUser.email,
        })
        .expect(401);
}

export async function updateIntegralUserData(app: INestApplication) {
    //main
    const res = await request(app.getHttpServer())
        .patch(`/users/${buyerUser.userId}`)
        .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
        .send({
            loginId: 'edited_userId',
            name: '更改後的名稱',
            password: '12345678*',
            email: 'edited_email@example.com',
            phone: '0987654321'
        })
        .expect(200);

    expect(res.body).toHaveProperty('userId', buyerUser.userId);
    expect(res.body.loginId).toBe('edited_userId');
    expect(res.body.name).toBe('更改後的名稱');
    expect(res.body.email).toBe('edited_email@example.com');
    expect(res.body.phone).toBe('0987654321');

    //login test
    const login_res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
            loginId: 'edited_userId',
            password: '12345678*',
        })
        .expect(201);
    const cookies = login_res.headers['set-cookie'];
    const cookieString = Array.isArray(cookies) ? cookies.join(';') : cookies;
    expect(cookieString).toContain('refreshToken');
    expect(cookieString).toContain('accessToken');
    buyerUser.cookie.accessToken = cookieString.match(/accessToken=([^;]+);/)?.[1] || '';
    buyerUser.cookie.refreshToken = cookieString.match(/refreshToken=([^;]+);/)?.[1] || '';

    // reset
    await request(app.getHttpServer())
        .patch(`/users/${buyerUser.userId}`)
        .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
        .send({
            loginId: buyerUser.loginId,
            name: buyerUser.name,
            password: buyerUser.password,
            email: buyerUser.email,
            phone: buyerUser.phone
        })
        .expect(200);
}

export async function updatePartialUserData(app: INestApplication) {
    const res = await request(app.getHttpServer())
        .patch(`/users/${buyerUser.userId}`)
        .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
        .send({
            name: '更改後的名稱',
            password: '12345678*',
        })
        .expect(200);
    expect(res.body).toHaveProperty('userId', buyerUser.userId);
    expect(res.body.name).toBe('更改後的名稱');

    //login test
    const login_res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
            loginId: buyerUser.loginId,
            password: '12345678*',
        })
        .expect(201);
    const cookies = login_res.headers['set-cookie'];
    const cookieString = Array.isArray(cookies) ? cookies.join(';') : cookies;
    expect(cookieString).toContain('refreshToken');
    expect(cookieString).toContain('accessToken');
    buyerUser.cookie.accessToken = cookieString.match(/accessToken=([^;]+);/)?.[1] || '';
    buyerUser.cookie.refreshToken = cookieString.match(/refreshToken=([^;]+);/)?.[1] || '';

    // reset
    await request(app.getHttpServer())
        .patch(`/users/${buyerUser.userId}`)
        .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
        .send({
            name: buyerUser.name,
            password: buyerUser.password,
        })
        .expect(200);
}

export async function updateUserDataWithConflictLoginId(app: INestApplication) {
    await request(app.getHttpServer())
        .patch(`/users/${buyerUser.userId}`)
        .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
        .send({
            loginId: sellerUser.loginId,
        })
        .expect(409);
}

export async function updateUserDataWithConflictEmail(app: INestApplication) {
    await request(app.getHttpServer())
        .patch(`/users/${buyerUser.userId}`)
        .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
        .send({
            email: sellerUser.email,
        })
        .expect(409);
}

export async function updateUserDataWithNonPermissionRole(app: INestApplication) {
    await request(app.getHttpServer())
        .patch(`/users/${buyerUser.userId}`)
        .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
        .send({
            name: '更改後的名稱',
        })
        .expect(403);
}