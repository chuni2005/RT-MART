import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { buyerUser, sellerUser, adminUser } from '../../variables';

export async function getUserProfile(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .get('/auth/profile')
    .set('Cookie', `accessToken=${buyerUser.cookie.accessToken}`)
    .expect(200);
}

export async function getUserProfileWithWrongAccessTokenCookie(
  app: INestApplication,
): Promise<void> {
  const res = await request(app.getHttpServer())
    .get('/auth/profile')
    .set('Cookie', `accessToken=invalidaccesstoken`)
    .expect(401);
}

export async function getHealthTest(app: INestApplication){
    const res = await request(app.getHttpServer())
        .get('/auth/test/health')
        .expect(200);

    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('module', 'auth');
    expect(res.body).toHaveProperty('timestamp');
}