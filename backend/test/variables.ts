import { access } from "fs";

export let buyerUser = {
    userId: 0,
    loginId: 'buyer_user', 
    name: 'Buyer Test User',
    password: '!abc12345678', 
    email: 'buyer_user@example.com', 
    phone: '0912345678', 
    role: 'buyer',
    cookie: {
        accessToken: '',
        refreshToken: '',
    }
};

export let sellerUser = {
    userId: 0,
    loginId: 'seller_user', 
    name: 'Seller Test User',
    password: '?abc12345678', 
    email: 'seller_user@example.com',
    phone: '0912345678',
    role: 'seller',
    cookie: {
        accessToken: '',
        refreshToken: '',
    }
};

export let adminUser = {
    userId: 0,
    loginId: 'admin_user', 
    name: 'Admin Test User',
    password: '.abc12345678',
    email: 'admin_user@example.com',
    phone: '0912345678',
    role: 'admin',
    cookie: {
        accessToken: '',
        refreshToken: '',
    }
};
