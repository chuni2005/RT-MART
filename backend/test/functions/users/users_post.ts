import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { buyerUser, sellerUser, adminUser } from '../../variables';

// create a user with buyer role
export async function createBuyerUser(app: INestApplication): Promise<string> {
    const res = await request(app.getHttpServer())
        .post('/users')
        .send({
            loginId: buyerUser.loginId,
            password: buyerUser.password,
            name: buyerUser.name,
            email: buyerUser.email,
            phone: buyerUser.phone,
            role: buyerUser.role,
        })
        .expect(201);
    expect(res.body).toHaveProperty('userId');
    expect(res.body.loginId).toBe(buyerUser.loginId);
    buyerUser.userId = res.body.userId;
    return res.body.userId;
}

// create a user with seller role
export async function createSellerUser(app: INestApplication): Promise<string> {
    const res = await request(app.getHttpServer())
        .post('/users')
        .send({
            loginId: sellerUser.loginId,
            password: sellerUser.password,
            name: sellerUser.name,
            email: sellerUser.email,
            phone: sellerUser.phone,
            role: sellerUser.role,
        })
        .expect(201);
    expect(res.body).toHaveProperty('userId');
    expect(res.body.loginId).toBe(sellerUser.loginId);
    sellerUser.userId = res.body.userId;
    return res.body.userId;
}

// create a user with admin role
export async function createAdminUser(app: INestApplication): Promise<string> {
    const res = await request(app.getHttpServer())
        .post('/users')
        .send({
            loginId: adminUser.loginId,
            password: adminUser.password,
            name: adminUser.name,
            email: adminUser.email,
            phone: adminUser.phone,
            role: adminUser.role,
        })
        .expect(201);
    expect(res.body).toHaveProperty('userId');
    expect(res.body.loginId).toBe(adminUser.loginId);
    adminUser.userId = res.body.userId;
    return res.body.userId;
}

// create a user with login id conflict
// create a user with email conflict
export async function createUserWithConflict(app: INestApplication, loginId: string, email: string): Promise<void> {
    const res = await request(app.getHttpServer())
        .post('/users')
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

