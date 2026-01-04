import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormInput from '@/shared/components/FormInput';
import Select from '@/shared/components/Select';
import Button from '@/shared/components/Button';
import Icon from '@/shared/components/Icon';
import sellerService from '@/shared/services/sellerService';
import productService from '@/shared/services/productService';
import { DiscountFormData } from '@/types/seller';
import { ProductType } from '@/types/product';
import { useForm } from '@/shared/hooks/useForm';
import styles from './DiscountEdit.module.scss';

function DiscountEdit() {
  const navigate = useNavigate();
  const { discountId } = useParams<{ discountId: string }>();
  const isEditMode = Boolean(discountId);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [copied, setCopied] = useState(false);

  const form = useForm(
    {
      discountCode: '',
      name: '',
      description: '',
      minPurchaseAmount: '',
      startDatetime: '',
      endDatetime: '',
      usageLimit: '',
      productTypeId: '',
      discountRate: '',
      maxDiscountAmount: '',
    },
    async () => {},
    {
      name: (value) => {
        if (!value) return '請輸入折扣名稱';
        if (value.length < 2) return '折扣名稱至少需要 2 個字元';
        if (value.length > 50) return '折扣名稱不可超過 50 個字元';
        return null;
      },
      description: (value) => {
        if (value && value.length > 200) return '描述不可超過 200 個字元';
        return null;
      },
      minPurchaseAmount: (value) => {
        if (!value) return '請輸入最低消費金額';
        if (Number(value) < 0) return '最低消費金額不可為負數';
        return null;
      },
      startDatetime: (value) => {
        if (!value) return '請選擇開始時間';
        return null;
      },
      endDatetime: (value) => {
        if (!value) return '請選擇結束時間';
        return null;
      },
      usageLimit: (value) => {
        if (value && Number(value) < 1) return '使用次數上限至少為 1';
        return null;
      },
      discountRate: (value) => {
        if (!value) return '請輸入折扣率';
        if (Number(value) < 0.01) return '折扣率至少為 0.01';
        if (Number(value) > 1) return '折扣率不可超過 1';
        return null;
      },
      maxDiscountAmount: (value) => {
        if (value && Number(value) < 0) return '最高折抵金額不可為負數';
        return null;
      },
    }
  );

  const { values, errors, validateAll, setValue } = form;

  // 包裝 handleChange 以支持直接傳值的方式
  const handleChange = (
    nameOrEvent: string | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    value?: string
  ) => {
    if (typeof nameOrEvent === 'string') {
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
      } as React.FocusEvent<HTMLInputElement>;
      form.handleBlur(mockEvent);
    } else {
      // 傳遞事件對象
      form.handleBlur(nameOrEvent);
    }
  };

  useEffect(() => {
    loadProductTypes();
    if (isEditMode && discountId) {
      loadDiscount(discountId);
    }
  }, [discountId]);

  const loadProductTypes = async () => {
    try {
      const types = await productService.getProductTypes();
      setProductTypes(types);
    } catch (error) {
      console.error('載入商品類型失敗:', error);
    }
  };

  const loadDiscount = async (id: string) => {
    setLoading(true);
    try {
      const discount = await sellerService.getDiscount(id);
      setValue('discountCode', discount.discountCode); // Keep for display only
      setValue('name', discount.name);
      setValue('description', discount.description || '');
      setValue('minPurchaseAmount', discount.minPurchaseAmount.toString());
      setValue('startDatetime', discount.startDatetime.slice(0, 16));
      setValue('endDatetime', discount.endDatetime.slice(0, 16));
      setValue('usageLimit', discount.usageLimit?.toString() || '');
      setValue('productTypeId', discount.productTypeId || '');
      setValue('discountRate', discount.discountRate.toString());
      setValue(
        'maxDiscountAmount',
        discount.maxDiscountAmount?.toString() || ''
      );
    } catch (error) {
      console.error('載入折扣失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(values.discountCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('複製失敗:', err);
    }
  };

  const handleSave = async () => {
    if (!validateAll()) {
      return;
    }

    // 驗證結束時間必須晚於開始時間
    if (new Date(values.endDatetime) <= new Date(values.startDatetime)) {
      alert('結束時間必須晚於開始時間');
      return;
    }

    setSaving(true);
    try {
      const formData: DiscountFormData = {
        // discountCode removed - backend generates it
        name: values.name,
        description: values.description || undefined,
        minPurchaseAmount: Number(values.minPurchaseAmount),
        startDatetime: values.startDatetime,
        endDatetime: values.endDatetime,
        usageLimit: values.usageLimit ? Number(values.usageLimit) : undefined,
        productTypeId: values.productTypeId || null,
        discountRate: Number(values.discountRate),
        maxDiscountAmount: values.maxDiscountAmount
          ? Number(values.maxDiscountAmount)
          : undefined,
      };

      if (isEditMode && discountId) {
        await sellerService.updateDiscount(discountId, formData);
        alert('折扣已更新');
      } else {
        const createdDiscount = await sellerService.createDiscount(formData);
        alert(`折扣已創建！折扣碼：${createdDiscount.discountCode}`);
      }

      navigate('/seller/discounts');
    } catch (error) {
      console.error('儲存折扣失敗:', error);
      alert('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>載入中...</div>;
  }

  return (
    <div className={styles.discountEdit}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate('/seller/discounts')} className={styles.backButton}>
          <Icon icon="arrow-left" />
          返回列表
        </Button>
        <h1 className={styles.pageTitle}>
          {isEditMode ? '編輯折扣' : '新增折扣'}
        </h1>
      </div>

      <div className={styles.formContainer}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>基本資訊</h2>

          <FormInput
            label="折扣名稱"
            name="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.name}
            required
            placeholder="例如：新年優惠"
          />

          {isEditMode && values.discountCode && (
            <div className={styles.formGroup}>
              <label className={styles.label}>折扣碼</label>
              <div className={styles.discountCodeDisplay}>
                <Icon icon="ticket" />
                <span className={styles.codeText}>{values.discountCode}</span>
                <button
                  type="button"
                  className={styles.copyButton}
                  onClick={handleCopyCode}
                  title="複製折扣碼"
                >
                  <Icon icon={copied ? "check" : "copy"} />
                  {copied && <span className={styles.copiedText}>已複製</span>}
                </button>
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>描述</label>
            <textarea
              name="description"
              value={values.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              className={styles.textarea}
              rows={3}
              placeholder="請輸入折扣活動描述"
            />
            {errors.description && (
              <span className={styles.errorText}>{errors.description}</span>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>折扣設定</h2>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              適用類型 <span className={styles.optional}>(選填，不選則全館適用)</span>
            </label>
            <Select
              value={values.productTypeId}
              onChange={(value) => handleChange('productTypeId', value)}
              options={[
                { value: '', label: '全館適用' },
                ...productTypes.map((type) => ({
                  value: type.productTypeId,
                  label: type.typeName,
                })),
              ]}
            />
          </div>

          <div className={styles.row}>
            <FormInput
              label="折扣率"
              name="discountRate"
              type="number"
              value={values.discountRate}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.discountRate}
              required
              placeholder="0.1"
              min={0.01}
              max={1}
              step={0.01}
              help="輸入 0.1 代表 10% 折扣"
            />

            <FormInput
              label="最高折抵金額"
              name="maxDiscountAmount"
              type="number"
              value={values.maxDiscountAmount}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.maxDiscountAmount}
              placeholder="不限制"
              min={0}
              help="留空表示不限制"
            />
          </div>

          <FormInput
            label="最低消費金額"
            name="minPurchaseAmount"
            type="number"
            value={values.minPurchaseAmount}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.minPurchaseAmount}
            required
            placeholder="0"
            min={0}
          />

          <FormInput
            label="使用次數上限"
            name="usageLimit"
            type="number"
            value={values.usageLimit}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.usageLimit}
            placeholder="不限制"
            min={1}
            help="留空表示不限制"
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>有效期間</h2>

          <div className={styles.row}>
            <FormInput
              label="開始時間"
              name="startDatetime"
              type="datetime-local"
              value={values.startDatetime}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.startDatetime}
              required
            />

            <FormInput
              label="結束時間"
              name="endDatetime"
              type="datetime-local"
              value={values.endDatetime}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.endDatetime}
              required
            />
          </div>
        </section>

        <div className={styles.actions}>
          <Button variant="outline" onClick={() => navigate('/seller/discounts')}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '儲存中...' : '儲存折扣'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DiscountEdit;
