/**
 * Address Service - API Integration
 * 地址管理服務（收貨地址、配送地址等）
 */

import { get, post, patch, del } from './api';
import type { Address } from '@/types';

// ============================================
// 設定與環境變數
// ============================================

const USE_MOCK_API = (import.meta as any).env.VITE_USE_MOCK_API === 'true';

console.log(`[AddressService] Current Mode: ${USE_MOCK_API ? 'MOCK' : 'REAL API'}`);

// ============================================
// 介面定義 (Backend API Response Types)
// ============================================

/**
 * 後端 ShippingAddress Entity 結構
 */
interface BackendAddress {
  addressId: string;
  userId: string;
  recipientName: string;
  phone: string;
  city: string;
  district: string | null;
  postalCode: string | null;
  addressLine1: string;
  addressLine2: string | undefined;
  isDefault: boolean;
}

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
    addressLine1: '忠孝東路三段 100 號',
    addressLine2: '5 樓',
    isDefault: true,
  },
  {
    id: 'addr_002',
    recipientName: '王小明',
    phone: '0912345678',
    city: '台中市',
    district: '西區',
    postalCode: '403',
    addressLine1: '公益路 200 號',
    isDefault: false,
  },
  {
    id: 'addr_003',
    recipientName: '李小華',
    phone: '0923456789',
    city: '高雄市',
    district: '前鎮區',
    postalCode: '806',
    addressLine1: '中山三路 88 號',
    addressLine2: '3 樓之 2',
    isDefault: false,
  },
];

// ============================================
// 輔助函數
// ============================================

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 將後端 Address Entity 轉換為前端 Address 介面
 */
const transformAddress = (backendAddr: BackendAddress): Address => {
  return {
    id: backendAddr.addressId,
    recipientName: backendAddr.recipientName,
    phone: backendAddr.phone,
    city: backendAddr.city,
    district: backendAddr.district || '',
    postalCode: backendAddr.postalCode || '',
    addressLine1: backendAddr.addressLine1,
    addressLine2: backendAddr.addressLine2 || undefined,
    isDefault: backendAddr.isDefault,
  };
};

// ============================================
// Service 函數
// ============================================

/**
 * 獲取用戶所有地址
 */
export const getAddresses = async (): Promise<Address[]> => {
  if (!USE_MOCK_API) {
    try {
      const data = await get<BackendAddress[]>('/shipping-addresses');
      return data.map(transformAddress);
    } catch (error) {
      console.error('[API Error] getAddresses:', error);
      throw error;
    }
  }

  console.log('[Mock API] Get all addresses');
  await delay(600);
  return [...mockAddresses];
};

/**
 * 獲取預設地址
 */
export const getDefaultAddress = async (): Promise<Address | null> => {
  if (!USE_MOCK_API) {
    try {
      const data = await get<BackendAddress | null>('/shipping-addresses/default');
      return data ? transformAddress(data) : null;
    } catch (error) {
      console.error('[API Error] getDefaultAddress:', error);
      throw error;
    }
  }

  console.log('[Mock API] Get default address');
  await delay(600);
  const defaultAddr = mockAddresses.find((addr) => addr.isDefault);
  return defaultAddr || null;
};

/**
 * 新增地址
 */
export const addAddress = async (
  addressData: Omit<Address, 'id'>
): Promise<Address> => {
  if (!USE_MOCK_API) {
    try {
      // 處理空值：如果 addressLine2 是空字串，則設為 undefined
      const dataToSend = {
        ...addressData,
        addressLine2: addressData.addressLine2?.trim() || undefined,
      };
      const data = await post<BackendAddress>('/shipping-addresses', dataToSend);
      return transformAddress(data);
    } catch (error) {
      console.error('[API Error] addAddress:', error);
      throw error;
    }
  }

  console.log('[Mock API] Add address:', addressData);
  await delay(700);

  const newAddress: Address = {
    id: `addr_${Date.now()}`,
    ...addressData,
    addressLine2: addressData.addressLine2?.trim() || undefined,
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
 */
export const updateAddress = async (
  addressId: string,
  addressData: Partial<Address>
): Promise<Address> => {
  if (!USE_MOCK_API) {
    try {
      // 處理空值：如果 addressLine2 存在且為空字串，則設為 undefined
      const dataToSend = {
        ...addressData,
      };
      if (addressData.addressLine2 !== undefined) {
        dataToSend.addressLine2 = addressData.addressLine2?.trim() || undefined;
      }

      const data = await patch<BackendAddress>(`/shipping-addresses/${addressId}`, dataToSend);
      return transformAddress(data);
    } catch (error) {
      console.error('[API Error] updateAddress:', error);
      throw error;
    }
  }

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

  // 處理空值：如果 addressLine2 存在且為空字串，則設為 undefined
  const normalizedData = { ...addressData };
  if (normalizedData.addressLine2 !== undefined) {
    normalizedData.addressLine2 = normalizedData.addressLine2?.trim() || undefined;
  }

  mockAddresses[index] = { ...mockAddresses[index], ...normalizedData };
  return mockAddresses[index];
};

/**
 * 刪除地址
 */
export const deleteAddress = async (
  addressId: string
): Promise<{ success: boolean; message: string }> => {
  if (!USE_MOCK_API) {
    try {
      await del(`/shipping-addresses/${addressId}`);
      return { success: true, message: '地址已刪除' };
    } catch (error) {
      console.error('[API Error] deleteAddress:', error);
      throw error;
    }
  }

  console.log('[Mock API] Delete address:', addressId);
  await delay(600);

  const index = mockAddresses.findIndex((addr) => addr.id === addressId);
  if (index === -1) {
    throw new Error('地址不存在');
  }

  mockAddresses.splice(index, 1);
  return { success: true, message: '地址已刪除' };
};

/**
 * 設為預設地址
 */
export const setDefaultAddress = async (addressId: string): Promise<Address> => {
  if (!USE_MOCK_API) {
    try {
      const data = await post<BackendAddress>(`/shipping-addresses/${addressId}/set-default`);
      return transformAddress(data);
    } catch (error) {
      console.error('[API Error] setDefaultAddress:', error);
      throw error;
    }
  }

  console.log('[Mock API] Set address as default:', addressId);
  await delay(600);

  const index = mockAddresses.findIndex((addr) => addr.id === addressId);
  if (index === -1) {
    throw new Error('地址不存在');
  }

  // 取消其他地址的預設狀態
  mockAddresses.forEach((addr) => {
    addr.isDefault = false;
  });

  mockAddresses[index].isDefault = true;
  return mockAddresses[index];
};
