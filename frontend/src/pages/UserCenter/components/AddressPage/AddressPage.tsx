import { useState, useEffect } from 'react';
import AddressCard from '@/pages/Checkout/components/AddressCard';
import AddressFormDialog, { AddressFormData } from '@/pages/Checkout/components/AddressFormDialog';
import Dialog from '@/shared/components/Dialog';
import Button from '@/shared/components/Button';
import { Address } from '@/types/common';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from '@/shared/services/addressService';
import styles from './AddressPage.module.scss';

/**
 * 收件地址管理頁面
 */
function AddressPage() {
  // Address list data
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Dialog mode and selected address
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Fetch addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  /**
   * Fetch all addresses
   */
  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const data = await getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      // TODO: Show error toast/alert
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Open dialog to add new address
   */
  const handleAddAddress = () => {
    setDialogMode('add');
    setSelectedAddress(null);
    setShowFormDialog(true);
  };

  /**
   * Open dialog to edit existing address
   */
  const handleEditAddress = (address: Address) => {
    setDialogMode('edit');
    setSelectedAddress(address);
    setShowFormDialog(true);
  };

  /**
   * Open confirmation dialog to delete address
   */
  const handleDeleteConfirm = (address: Address) => {
    setSelectedAddress(address);
    setShowDeleteDialog(true);
  };

  /**
   * Set address as default
   */
  const handleSetDefault = async (addressId: string) => {
    try {
      await updateAddress(addressId, { isDefault: true });
      await fetchAddresses(); // Refresh list
      // TODO: Show success message
    } catch (error) {
      console.error('Failed to set default:', error);
      // TODO: Show error alert
    }
  };

  /**
   * Submit new address
   */
  const handleSubmitNewAddress = async (data: AddressFormData) => {
    try {
      await addAddress(data);
      setShowFormDialog(false);
      await fetchAddresses(); // Refresh list
      // TODO: Show success message
    } catch (error) {
      console.error('Failed to add address:', error);
      // TODO: Show error alert
    }
  };

  /**
   * Submit edited address
   */
  const handleSubmitEditAddress = async (data: AddressFormData) => {
    if (!selectedAddress) return;

    try {
      await updateAddress(selectedAddress.id, data);
      setShowFormDialog(false);
      await fetchAddresses(); // Refresh list
      // TODO: Show success message
    } catch (error) {
      console.error('Failed to update address:', error);
      // TODO: Show error alert
    }
  };

  /**
   * Delete address
   */
  const handleDeleteAddress = async () => {
    if (!selectedAddress) return;

    try {
      await deleteAddress(selectedAddress.id);
      setShowDeleteDialog(false);
      setSelectedAddress(null);
      await fetchAddresses(); // Refresh list
      // TODO: Show success message
    } catch (error) {
      console.error('Failed to delete address:', error);
      // TODO: Show error alert
    }
  };

  return (
    <div className={styles.addressPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>收件地址管理</h2>
        <Button
          variant="primary"
          icon="plus"
          onClick={handleAddAddress}
        >
          新增地址
        </Button>
      </div>

      {/* Address List */}
      {isLoading ? (
        <div className={styles.loading}>載入中...</div>
      ) : addresses.length === 0 ? (
        <div className={styles.emptyState}>
          <p>尚無收件地址</p>
          <Button variant="primary" onClick={handleAddAddress}>
            新增第一個地址
          </Button>
        </div>
      ) : (
        <div className={styles.addressGrid}>
          {addresses.map((address) => (
            <div key={address.id} className={styles.addressItem}>
              <AddressCard
                address={address}
                isDefault={address.isDefault}
              />
              <div className={styles.addressActions}>
                {!address.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(address.id)}
                  >
                    設為預設
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditAddress(address)}
                >
                  編輯
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteConfirm(address)}
                >
                  刪除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Dialog */}
      <AddressFormDialog
        isOpen={showFormDialog}
        onClose={() => setShowFormDialog(false)}
        onSubmit={dialogMode === 'add' ? handleSubmitNewAddress : handleSubmitEditAddress}
        mode={dialogMode}
        initialData={selectedAddress || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        type="confirm"
        variant="danger"
        icon="exclamation-triangle"
        title="確定要刪除此地址嗎？"
        message="刪除後無法復原"
        confirmText="確定刪除"
        cancelText="取消"
        onConfirm={handleDeleteAddress}
      />
    </div>
  );
}

export default AddressPage;
