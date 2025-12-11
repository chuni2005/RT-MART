/**
 * Address Service - Mock API
 * 地址管理服務（收貨地址、配送地址等）
 */

import type { Address } from '@/types';

// ============================================
// Mock 資料
// ============================================

const mockAddresses: Address[] = [
  {
    id: 'addr_001',
    recipientName: '王小明',
    phone: '0912345678',
    city: '台北市',
    district: '大安區',
    postalCode: '106',
    detail: '忠孝東路三段 100 號 5 樓',
    isDefault: true,
  },
  {
    id: 'addr_002',
    recipientName: '王小明',
    phone: '0912345678',
    city: '台中市',
    district: '西區',
    postalCode: '403',
    detail: '公益路 200 號',
    isDefault: false,
  },
  {
    id: 'addr_003',
    recipientName: '李小華',
    phone: '0923456789',
    city: '高雄市',
    district: '前鎮區',
    postalCode: '806',
    detail: '中山三路 88 號 3 樓之 2',
    isDefault: false,
  },
];

// ============================================
// 輔助函數
// ============================================

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// Service 函數
// ============================================

/**
 * 獲取用戶所有地址
 * TODO: 替換為 GET /api/v1/user/addresses
 */
export const getAddresses = async (): Promise<Address[]> => {
  console.log('[Mock API] Get all addresses');
  await delay(600);
  return [...mockAddresses];
};

/**
 * 獲取預設地址
 * TODO: 替換為 GET /api/v1/user/addresses/default
 */
export const getDefaultAddress = async (): Promise<Address | null> => {
  console.log('[Mock API] Get default address');
  await delay(600);
  const defaultAddr = mockAddresses.find((addr) => addr.isDefault);
  return defaultAddr || null;
};

/**
 * 新增地址
 * TODO: 替換為 POST /api/v1/user/addresses
 */
export const addAddress = async (
  addressData: Omit<Address, 'id'>
): Promise<Address> => {
  console.log('[Mock API] Add address:', addressData);
  await delay(700);

  const newAddress: Address = {
    id: `addr_${Date.now()}`,
    ...addressData,
  };

  // 如果設為預設，取消其他地址的預設狀態
  if (newAddress.isDefault) {
    mockAddresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  mockAddresses.push(newAddress);
  return newAddress;
};

/**
 * 更新地址
 * TODO: 替換為 PUT /api/v1/user/addresses/:id
 */
export const updateAddress = async (
  addressId: string,
  addressData: Partial<Address>
): Promise<Address> => {
  console.log('[Mock API] Update address:', addressId, addressData);
  await delay(700);

  const index = mockAddresses.findIndex((addr) => addr.id === addressId);
  if (index === -1) {
    throw new Error('地址不存在');
  }

  // 如果設為預設，取消其他地址的預設狀態
  if (addressData.isDefault) {
    mockAddresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  mockAddresses[index] = { ...mockAddresses[index], ...addressData };
  return mockAddresses[index];
};

/**
 * 刪除地址
 * TODO: 替換為 DELETE /api/v1/user/addresses/:id
 */
export const deleteAddress = async (
  addressId: string
): Promise<{ success: boolean; message: string }> => {
  console.log('[Mock API] Delete address:', addressId);
  await delay(600);

  const index = mockAddresses.findIndex((addr) => addr.id === addressId);
  if (index === -1) {
    throw new Error('地址不存在');
  }

  mockAddresses.splice(index, 1);
  return { success: true, message: '地址已刪除' };
};
