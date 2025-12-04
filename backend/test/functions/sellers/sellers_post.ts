import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { adminTester, buyerUser, sellerUser, adminUser, buyerUser_sellerCase } from '../../variables';

export async function appplyOwnBuyerAccountToSellerRole(app: INestApplication, buyer: any) {
    const res = await request(app.getHttpServer())
        .post(`/sellers`)
        .set('Cookie', `accessToken=${buyer.cookie.accessToken}`)
        .expect(201);
    expect(res.body).toHaveProperty('userId', buyer.userId);
    expect(res.body).toHaveProperty('sellerId');
    buyer.sellerId = res.body.sellerId;
}

export async function appplyOwnSellerAccountToSellerRole(app: INestApplication) {
    await request(app.getHttpServer())
        .post(`/sellers`)
        .set('Cookie', `accessToken=${sellerUser.cookie.accessToken}`)
        .expect(403);
}

export async function appplyOwnAdminAccountToSellerRole(app: INestApplication) {
    await request(app.getHttpServer())
        .post(`/sellers`)
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(403);
}

export async function appplyOwnBuyerAccountToSellerRoleWithNonCookie(app: INestApplication) {
    await request(app.getHttpServer())
        .post(`/sellers`)
        .expect(401);
}

export async function verifyApplicationOfSeller(app: INestApplication, buyer: any) {
    const res = await request(app.getHttpServer())
        .post(`/sellers/${buyer.sellerId}/verify`)
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(201);
    expect(res.body).toHaveProperty('storeId');
    buyer.storeId = res.body.storeId;

    const res_user = await request(app.getHttpServer())
        .get(`/users/${buyer.userId}`)
        .expect(200);
    expect(res_user.body).toHaveProperty('role', 'seller');
}

export async function verifyApplicationOfVerifiedSeller(app: INestApplication) {
    await request(app.getHttpServer())
        .post(`/sellers/${buyerUser.sellerId}/verify`)
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(409);
}

export async function verifyApplicationOfNonExistedSeller(app: INestApplication) {
    await request(app.getHttpServer())
        .post(`/sellers/10000/verify`)
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(404);
}

export async function verifyApplicationOfSellerWithNonPermissionRole(app: INestApplication) {
    await request(app.getHttpServer())
        .post(`/sellers/${buyerUser.sellerId}/verify`)
        .set('Cookie', `accessToken=${sellerUser.cookie.accessToken}`)
        .expect(403);
}