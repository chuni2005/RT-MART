import { useState, useEffect } from 'react';
import FormInput from '@/shared/components/FormInput';
import Button from '@/shared/components/Button';
import Alert from '@/shared/components/Alert';
import sellerService from '@/shared/services/sellerService';
import { StoreInfo } from '@/types/seller';
import { useForm } from '@/shared/hooks/useForm';
import styles from './StoreSettings.module.scss';

function StoreSettings() {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const { values, errors, handleChange, handleBlur, validate, setValue } = useForm({
    initialValues: {
      storeName: '',
      storeDescription: '',
      storePhone: '',
      storeEmail: '',
      storeAddress: '',
      bankAccountReference: '',
    },
    validationRules: {
      storeName: { required: true, minLength: 2, maxLength: 50 },
      storeDescription: { maxLength: 500 },
      storePhone: { required: true, pattern: /^09\d{8}$/ },
      storeEmail: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      storeAddress: { required: true },
      bankAccountReference: { required: true, pattern: /^\d{10,16}$/ },
    },
  });

  useEffect(() => {
    loadStoreInfo();
  }, []);

  const loadStoreInfo = async () => {
    setLoading(true);
    try {
      const data = await sellerService.getStoreInfo();
      setStoreInfo(data);
      // 填充表單數據
      Object.keys(data).forEach((key) => {
        if (key in values) {
          setValue(key, data[key as keyof StoreInfo] || '');
        }
      });
    } catch (error) {
      console.error('載入商店資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validate()) {
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
            placeholder="09xxxxxxxx"
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
            placeholder="10-16位數字"
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
