import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { buyerUser, sellerUser, adminUser, adminTester, buyerUser_sellerCase } from '../../variables';

export async function getAllOfStores(app: INestApplication) {
    const res = await request(app.getHttpServer())
        .get('/stores?page=1&limit=10')
        .expect(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
}

export async function getStoresWithFilter(app: INestApplication) {
    const res = await request(app.getHttpServer())
        .get(`/stores?page=1&limit=10&&search=${buyerUser.name}`)
        .expect(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
}

export async function getSingleStoreById(app: INestApplication) {
    const res = await request(app.getHttpServer())
        .get(`/stores/${buyerUser_sellerCase.storeId}`)
        .expect(200);
    expect(res.body).toHaveProperty('storeId', buyerUser_sellerCase.storeId);
}

export async function getSingleStoreByDeletedStoreId(app: INestApplication) {
    const res = await request(app.getHttpServer())
        .get(`/stores/${buyerUser.storeId}`)
        .expect(404);
}

export async function getSingleStoreByNonExistentId(app: INestApplication) {
    const res = await request(app.getHttpServer())
        .get(`/stores/10000`)
        .expect(404);
}

export async function getHealthTest(app: INestApplication) {
    await request(app.getHttpServer())
        .get('/stores/test/health')
        .expect(200);
}