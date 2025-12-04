import { access } from 'fs';

// to-do: edit to seed admin
export const adminTester = Object.freeze({
  userId: 51,
  loginId: 'chunichenmao8',
  name: '貓貓君',
  password: 'admin123456',
  email: 'chuni2005@gmail.com',
  phone: '',
  role: 'admin',
  cookie: {
    accessToken: '',
    refreshToken: '',
  }
});

export let buyerUser = {
  userId: 0,
  sellerId: 0,
  storeId: 0,
  loginId: 'buyer_user',
  name: 'Buyer Test User',
  password: '!abc12345678',
  email: 'buyer_user@example.com',
  phone: '0912345678',
  role: 'buyer',
  cookie: {
    accessToken: '',
    refreshToken: '',
  },
};

//sellers: no verified case
export let buyerUser_sellerCase = {
  userId: 0,
  sellerId: 0,
  storeId: 0,
  loginId: 'buyer_user2',
  name: 'Buyer Test User 2',
  password: '!abc12345678',
  email: 'buyer_user2@example.com',
  phone: '0912345678',
  role: 'buyer',
  cookie: {
    accessToken: '',
    refreshToken: '',
  },
};

//users: no sellers data case
//the seller created by admin case
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
  },
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
  },
};
