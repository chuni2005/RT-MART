import type { Address } from '@/types';
import Dialog from '@/shared/components/Dialog';
import AddressCard from '../AddressCard';
import Button from '@/shared/components/Button';
import styles from './AddressSelectionDialog.module.scss';

interface AddressSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: Address[];
  currentAddressId: string | null;
  onSelectAddress: (addressId: string) => void;
  onAddNewAddress: () => void;
}

/**
 * AddressSelectionDialog Component
 * 地址選擇 Dialog，顯示所有可用地址並允許選擇
 *
 * @param isOpen - Dialog 是否開啟
 * @param onClose - 關閉 Dialog 的回調函數
 * @param addresses - 地址列表
 * @param currentAddressId - 當前選中的地址 ID
 * @param onSelectAddress - 選擇地址的回調函數
 * @param onAddNewAddress - 新增地址的回調函數
 */
function AddressSelectionDialog({
  isOpen,
  onClose,
  addresses,
  currentAddressId,
  onSelectAddress,
  onAddNewAddress,
}: AddressSelectionDialogProps) {
  const handleSelectAddress = (addressId: string) => {
    onSelectAddress(addressId);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="選擇收件地址" type="custom">
      <div className={styles.content}>
        {/* 地址列表 */}
        <div className={styles.addressList}>
          {addresses.length === 0 ? (
            <div className={styles.emptyState}>
              <p>尚無收件地址</p>
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address.id}
                className={`${styles.addressItem} ${
                  address.id === currentAddressId ? styles.selected : ''
                }`}
                onClick={() => handleSelectAddress(address.id)}
              >
                <AddressCard address={address} isDefault={address.isDefault} />
              </div>
            ))
          )}
        </div>

        {/* 新增地址按鈕 */}
        <Button
          variant="outline"
          fullWidth
          onClick={onAddNewAddress}
          className={styles.addButton}
        >
          + 新增收件地址
        </Button>
      </div>
    </Dialog>
  );
}

export default AddressSelectionDialog;
