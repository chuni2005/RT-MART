import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { buyerUser, sellerUser, adminUser } from '../../variables';

// get all of users
export async function getUsers(app: INestApplication): Promise<any> {
    const res = await request(app.getHttpServer())
        .get('/users?page=1&limit=10')
        .expect(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
    return res.body;
}

// get users with filter and page
export async function getUsersWithFilter(app: INestApplication, role: string, search: string): Promise<any> {
    const res = await request(app.getHttpServer())
        .get(`/users?page=1&limit=10&role=${role}&search=${search}`)
        .expect(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
    return res.body;
}

//get all of deleted users
export async function getDeletedUsers(app: INestApplication, adminToken: string): Promise<any> {
    const res = await request(app.getHttpServer())
        .get('/users/deleted?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
    return res.body;
}