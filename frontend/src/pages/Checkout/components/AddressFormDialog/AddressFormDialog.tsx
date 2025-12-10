import { useState, useEffect } from 'react';
import Dialog from '@/shared/components/Dialog';
import FormInput from '@/shared/components/FormInput';
import Select from '@/shared/components/Select';
import Button from '@/shared/components/Button';
import { cityOptions, getDistrictsByCity } from '@/shared/utils/taiwanAddressData';
import styles from './AddressFormDialog.module.scss';

export interface AddressFormData {
  recipientName: string;
  phone: string;
  city: string;
  district: string;
  postalCode: string;
  detail: string;
  isDefault: boolean;
}

interface AddressFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddressFormData) => void;
  initialData?: Partial<AddressFormData>;
  mode?: 'add' | 'edit';
}

/**
 * AddressFormDialog Component
 * 新增/編輯地址表單 Dialog
 *
 * @param isOpen - Dialog 是否開啟
 * @param onClose - 關閉 Dialog 的回調函數
 * @param onSubmit - 提交表單的回調函數
 * @param initialData - 初始表單資料（編輯模式使用）
 * @param mode - 表單模式（add 或 edit）
 */
function AddressFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = 'add',
}: AddressFormDialogProps) {
  const [formData, setFormData] = useState<AddressFormData>({
    recipientName: initialData?.recipientName || '',
    phone: initialData?.phone || '',
    city: initialData?.city || '',
    district: initialData?.district || '',
    postalCode: initialData?.postalCode || '',
    detail: initialData?.detail || '',
    isDefault: initialData?.isDefault || false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AddressFormData, string>>>({});

  // 當 initialData 變化時更新表單
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        recipientName: initialData.recipientName || '',
        phone: initialData.phone || '',
        city: initialData.city || '',
        district: initialData.district || '',
        postalCode: initialData.postalCode || '',
        detail: initialData.detail || '',
        isDefault: initialData.isDefault || false,
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  // 表單驗證
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AddressFormData, string>> = {};

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = '請輸入收件人姓名';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '請輸入聯絡電話';
    } else if (!/^09\d{8}$/.test(formData.phone)) {
      newErrors.phone = '請輸入有效的手機號碼（例：0912345678）';
    }

    if (!formData.city) {
      newErrors.city = '請選擇城市';
    }

    if (!formData.district) {
      newErrors.district = '請選擇區域';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = '請輸入郵遞區號';
    } else if (!/^\d{3,5}$/.test(formData.postalCode)) {
      newErrors.postalCode = '請輸入有效的郵遞區號';
    }

    if (!formData.detail.trim()) {
      newErrors.detail = '請輸入詳細地址';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      onClose();
      // 重置表單
      setFormData({
        recipientName: '',
        phone: '',
        city: '',
        district: '',
        postalCode: '',
        detail: '',
        isDefault: false,
      });
      setErrors({});
    }
  };

  const handleCityChange = (value: string) => {
    setFormData({ ...formData, city: value, district: '' });
    if (errors.city) {
      setErrors({ ...errors, city: undefined });
    }
  };

  const handleDistrictChange = (value: string) => {
    setFormData({ ...formData, district: value });
    if (errors.district) {
      setErrors({ ...errors, district: undefined });
    }
  };

  const districtOptions = getDistrictsByCity(formData.city);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? '新增收件地址' : '編輯收件地址'}
      type="custom"
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* 收件人姓名 */}
        <FormInput
          label="收件人姓名"
          name="recipientName"
          value={formData.recipientName}
          onChange={(e) => {
            setFormData({ ...formData, recipientName: e.target.value });
            if (errors.recipientName) {
              setErrors({ ...errors, recipientName: undefined });
            }
          }}
          error={errors.recipientName}
          required
        />

        {/* 聯絡電話 */}
        <FormInput
          label="聯絡電話"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => {
            setFormData({ ...formData, phone: e.target.value });
            if (errors.phone) {
              setErrors({ ...errors, phone: undefined });
            }
          }}
          placeholder="0912345678"
          error={errors.phone}
          required
        />

        {/* 城市選擇 */}
        <div className={styles.formGroup}>
          <label>
            城市 <span className={styles.required}>*</span>
          </label>
          <Select
            options={cityOptions}
            value={formData.city}
            onChange={handleCityChange}
            placeholder="請選擇城市"
          />
          {errors.city && (
            <span className={styles.errorMessage}>{errors.city}</span>
          )}
        </div>

        {/* 區域選擇 */}
        <div className={styles.formGroup}>
          <label>
            區域 <span className={styles.required}>*</span>
          </label>
          <Select
            options={districtOptions}
            value={formData.district}
            onChange={handleDistrictChange}
            placeholder="請選擇區域"
            disabled={!formData.city}
          />
          {errors.district && (
            <span className={styles.errorMessage}>{errors.district}</span>
          )}
        </div>

        {/* 郵遞區號 */}
        <FormInput
          label="郵遞區號"
          name="postalCode"
          value={formData.postalCode}
          onChange={(e) => {
            setFormData({ ...formData, postalCode: e.target.value });
            if (errors.postalCode) {
              setErrors({ ...errors, postalCode: undefined });
            }
          }}
          placeholder="100"
          error={errors.postalCode}
          required
        />

        {/* 詳細地址 */}
        <div className={styles.formGroup}>
          <label>
            詳細地址 <span className={styles.required}>*</span>
          </label>
          <textarea
            name="detail"
            className={`${styles.textarea} ${errors.detail ? styles.error : ''}`}
            value={formData.detail}
            onChange={(e) => {
              setFormData({ ...formData, detail: e.target.value });
              if (errors.detail) {
                setErrors({ ...errors, detail: undefined });
              }
            }}
            placeholder="請輸入街道、巷弄、樓層等詳細資訊"
            rows={3}
          />
          {errors.detail && (
            <span className={styles.errorMessage}>{errors.detail}</span>
          )}
        </div>

        {/* 設為預設地址 */}
        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="isDefault"
            checked={formData.isDefault}
            onChange={(e) =>
              setFormData({ ...formData, isDefault: e.target.checked })
            }
          />
          <label htmlFor="isDefault">設為預設地址</label>
        </div>

        {/* 表單按鈕 */}
        <div className={styles.formActions}>
          <Button variant="outline" type="button" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" type="submit">
            {mode === 'add' ? '新增' : '儲存'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default AddressFormDialog;
