import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { adminTester, buyerUser, buyerUser_sellerCase, sellerUser, adminUser } from '../../variables';

export async function deleteUnverifiedSellerBySellerId(app: INestApplication) {
    await request(app.getHttpServer())
        .delete(`/sellers/${buyerUser_sellerCase.sellerId}`)
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(200);
}

export async function deleteVerifiedSellerBySellerId(app: INestApplication) {
    await request(app.getHttpServer())
        .delete(`/sellers/${buyerUser.sellerId}`)
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(409);
}

export async function deleteSellerWithNonExistedSeller(app: INestApplication) {
    await request(app.getHttpServer())
        .delete(`/sellers/10000`)
        .set('Cookie', `accessToken=${adminUser.cookie.accessToken}`)
        .expect(404);
}

export async function deleteSellerWithNonPermissionRole(app: INestApplication) {
    await request(app.getHttpServer())
        .delete(`/sellers/${buyerUser.sellerId}`)
        .set('Cookie', `accessToken=${sellerUser.cookie.accessToken}`)
        .expect(403);
}
