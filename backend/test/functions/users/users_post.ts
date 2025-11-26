import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { loginUser } from '../auth/auth_post'
import { buyerUser, sellerUser, adminUser, adminTester } from '../../variables';

export async function createUser(app: INestApplication, user: any){
    const res = await request(app.getHttpServer())
        .post('/users')
        .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
        .send({
            loginId: user.loginId,
            password: user.password,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
        })
        .expect(201);
    expect(res.body).toHaveProperty('userId');
    expect(res.body.loginId).toBe(user.loginId);
    user.userId = (res.body.userId!==adminTester.userId)? res.body.userId: 0;
    await loginUser(app, user);
}

export async function createUserWithConflict(app: INestApplication, loginId: string, email: string){
    const res = await request(app.getHttpServer())
        .post('/users')
        .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
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

export async function restoreDeletedUserById(app: INestApplication){
    const res = await request(app.getHttpServer())
      .post(`/users/${buyerUser.userId}/restore`)
      .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
      .expect(201);

    expect(res.body).toHaveProperty('userId', buyerUser.userId);

    await request(app.getHttpServer())
      .post(`/users/${sellerUser.userId}/restore`)
      .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
      .expect(201);
}

export async function restoreNonDeletedUserById(app: INestApplication){
    const res = await request(app.getHttpServer())
      .post(`/users/${buyerUser.userId}/restore`)
      .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
      .expect(409);
}

export async function restoreDeletedUserByNonExistentId(app: INestApplication){
    const res = await request(app.getHttpServer())
      .post(`/users/10000/restore`)
      .set('Cookie', `accessToken=${adminTester.cookie.accessToken}`)
      .expect(404);
}

export async function restoreDeletedUserWithNonPermissionRole(app: INestApplication){
    const res = await request(app.getHttpServer())
        .post(`/users/${buyerUser.userId}/restore`)
        .set('Cookie', `accessToken=${sellerUser.cookie.accessToken}`)
        .expect(403);
}
