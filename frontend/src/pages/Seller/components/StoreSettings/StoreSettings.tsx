import { useState, useEffect } from 'react';
import FormInput from '@/shared/components/FormInput';
import Button from '@/shared/components/Button';
import Alert from '@/shared/components/Alert';
import sellerService from '@/shared/services/sellerService';
import { useForm } from '@/shared/hooks/useForm';
import { validatePhone, validateEmail, validateBankAccount } from '@/shared/utils/validation';
import styles from './StoreSettings.module.scss';

function StoreSettings() {
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const form = useForm(
    {
      storeName: '',
      storeDescription: '',
      storePhone: '',
      storeEmail: '',
      storeAddress: '',
      bankAccountReference: '',
    },
    async () => {},
    {
      storeName: (value) => {
        if (!value) return '請輸入商店名稱';
        if (value.length < 2) return '商店名稱至少需要 2 個字元';
        if (value.length > 50) return '商店名稱不可超過 50 個字元';
        return null;
      },
      storeDescription: (value) => {
        if (value && value.length > 500) return '商店描述不可超過 500 個字元';
        return null;
      },
      storePhone: (value) => {
        if (!value) return '請輸入聯絡電話';
        return validatePhone(value);
      },
      storeEmail: (value) => {
        if (!value) return '請輸入 Email';
        return validateEmail(value);
      },
      storeAddress: (value) => {
        if (!value) return '請輸入實體地址';
        return null;
      },
      bankAccountReference: (value) => {
        if (!value) return '請輸入銀行帳戶';
        return validateBankAccount(value);
      },
    }
  );

  const { values, errors, validateAll, setValue } = form;

  // 包裝 handleChange 以支持直接傳值的方式
  const handleChange = (
    nameOrEvent:
      | string
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    value?: string
  ) => {
    if (typeof nameOrEvent === "string") {
      // 直接傳遞字段名和值
      const name = nameOrEvent;
      setValue(name as any, value);
      if (form.touched[name]) {
        form.validateField(name as any, value);
      }
    } else {
      // 傳遞事件對象
      form.handleChange(nameOrEvent);
    }
  };

  // 包裝 handleBlur 以支持直接傳字段名的方式
  const handleBlur = (nameOrEvent: string | React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (typeof nameOrEvent === 'string') {
      // 直接傳遞字段名 - 創建模擬事件對象
      const name = nameOrEvent;
      const mockEvent = {
        target: {
          name,
          value: values[name as keyof typeof values],
        },
      } as React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>;
      form.handleBlur(mockEvent);
    } else {
      // 傳遞事件對象
      form.handleBlur(nameOrEvent as any);
    }
  };

  useEffect(() => {
    loadStoreInfo();
  }, []);

  const loadStoreInfo = async () => {
    setLoading(true);
    try {
      const data = await sellerService.getStoreInfo();
      // 填充表單數據
      if (data.storeName !== undefined) setValue('storeName', data.storeName);
      if (data.storeDescription !== undefined) setValue('storeDescription', data.storeDescription || '');
      if (data.storePhone !== undefined) setValue('storePhone', data.storePhone || '');
      if (data.storeEmail !== undefined) setValue('storeEmail', data.storeEmail || '');
      if (data.storeAddress !== undefined) setValue('storeAddress', data.storeAddress || '');
      if (data.bankAccountReference !== undefined) setValue('bankAccountReference', data.bankAccountReference || '');
    } catch (error) {
      console.error('載入商店資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateAll()) {
      return;
    }

    setSaveStatus('saving');
    try {
      await sellerService.updateStoreInfo(values);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('儲存失敗:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  if (loading) {
    return <div className={styles.loading}>載入中...</div>;
  }

  return (
    <div className={styles.storeSettings}>
      <h1 className={styles.pageTitle}>商店設定</h1>

      <div className={styles.formContainer}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>商店基本資料</h2>

          <FormInput
            label="商店名稱"
            name="storeName"
            value={values.storeName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.storeName}
            required
            placeholder="請輸入商店名稱"
          />

          <div className={styles.formGroup}>
            <label className={styles.label}>商店描述</label>
            <textarea
              name="storeDescription"
              value={values.storeDescription}
              onChange={(e) => handleChange('storeDescription', e.target.value)}
              onBlur={() => handleBlur('storeDescription')}
              className={styles.textarea}
              rows={4}
              placeholder="請輸入商店描述"
            />
            {errors.storeDescription && (
              <span className={styles.errorText}>{errors.storeDescription}</span>
            )}
          </div>

          <FormInput
            label="聯絡電話"
            name="storePhone"
            value={values.storePhone}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.storePhone}
            required
            placeholder="0912-345-678"
          />

          <FormInput
            label="Email"
            name="storeEmail"
            type="email"
            value={values.storeEmail}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.storeEmail}
            required
            placeholder="example@email.com"
          />

          <FormInput
            label="實體地址"
            name="storeAddress"
            value={values.storeAddress}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.storeAddress}
            required
            placeholder="請輸入完整地址"
          />

          <FormInput
            label="銀行帳戶"
            name="bankAccountReference"
            value={values.bankAccountReference}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.bankAccountReference}
            required
            placeholder="123-4567890"
          />
        </section>

        {saveStatus === 'success' && <Alert type="success" message="儲存成功！" />}
        {saveStatus === 'error' && <Alert type="error" message="儲存失敗，請稍後再試。" />}

        <div className={styles.actions}>
          <Button onClick={handleSave} disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? '儲存中...' : '儲存變更'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default StoreSettings;
