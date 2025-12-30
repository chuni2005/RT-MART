import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormInput from '@/shared/components/FormInput';
import Button from '@/shared/components/Button';
import Icon from '@/shared/components/Icon';
import Alert from '@/shared/components/Alert';
import adminService from '@/shared/services/adminService.index';
import { AlertType } from '@/types';
import { useForm } from '@/shared/hooks/useForm';
import styles from './DiscountEdit.module.scss';

interface DiscountFormValues {
  discountType: 'seasonal' | 'shipping';
  name: string;
  description: string;
  minPurchaseAmount: string;
  startDatetime: string;
  endDatetime: string;
  isActive: boolean;
  // Seasonal discount fields
  discountRate: string;
  maxDiscountAmount: string;
  // Shipping discount field
  discountAmount: string;
}

function DiscountEdit() {
  const navigate = useNavigate();
  const { discountId } = useParams<{ discountId: string }>();
  const isEditMode = Boolean(discountId);
  const alertRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

  // Custom setAlert with scroll behavior
  const showAlert = (alertData: { type: AlertType; message: string } | null) => {
    setAlert(alertData);
    if (alertData && alertRef.current) {
      setTimeout(() => {
        alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const form = useForm<DiscountFormValues>(
    {
      discountType: 'seasonal',
      name: '',
      description: '',
      minPurchaseAmount: '',
      startDatetime: '',
      endDatetime: '',
      isActive: true,
      discountRate: '',
      maxDiscountAmount: '',
      discountAmount: '',
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
      discountRate: (value, allValues) => {
        if (allValues.discountType === 'seasonal') {
          if (!value) return '請輸入折扣率';
          if (Number(value) < 0.01) return '折扣率至少為 0.01';
          if (Number(value) > 1) return '折扣率不可超過 1';
        }
        return null;
      },
      maxDiscountAmount: (value) => {
        if (value && Number(value) < 0) return '最高折抵金額不可為負數';
        return null;
      },
      discountAmount: (value, allValues) => {
        if (allValues.discountType === 'shipping') {
          if (!value) return '請輸入折抵金額';
          if (Number(value) < 0) return '折抵金額不可為負數';
        }
        return null;
      },
    }
  );

  const { values, errors, validateAll, setValue } = form;

  const handleChange = (
    nameOrEvent:
      | string
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    value?: string
  ) => {
    if (typeof nameOrEvent === "string") {
      const name = nameOrEvent;
      setValue(name as any, value);
      if (form.touched[name]) {
        form.validateField(name as any, value);
      }
    } else {
      form.handleChange(nameOrEvent);
    }
  };

  const handleBlur = (nameOrEvent: string | React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (typeof nameOrEvent === 'string') {
      const name = nameOrEvent;
      const mockEvent = {
        target: {
          name,
          value: values[name as keyof typeof values],
        },
      } as React.FocusEvent<HTMLInputElement>;
      form.handleBlur(mockEvent);
    } else {
      form.handleBlur(nameOrEvent);
    }
  };

  useEffect(() => {
    if (isEditMode && discountId) {
      loadDiscount(discountId);
    }
  }, [discountId]);

  const loadDiscount = async (id: string) => {
    setLoading(true);
    try {
      const discounts = await adminService.getSystemDiscounts();
      const discount = discounts.find((d) => d.discount_id === id);

      if (!discount) {
        showAlert({ type: 'error', message: '找不到折扣' });
        navigate('/admin/discounts');
        return;
      }

      setValue('discountType', discount.discount_type);
      setValue('name', discount.name);
      setValue('description', discount.description || '');
      setValue('minPurchaseAmount', discount.min_purchase_amount.toString());
      setValue('startDatetime', discount.start_datetime.slice(0, 16));
      setValue('endDatetime', discount.end_datetime.slice(0, 16));
      setValue('isActive', discount.is_active);

      if (discount.discount_type === 'seasonal') {
        setValue('discountRate', (discount.discount_rate || 0).toString());
        setValue('maxDiscountAmount', discount.max_discount_amount?.toString() || '');
      } else {
        setValue('discountAmount', (discount.discount_amount || 0).toString());
      }
    } catch (error) {
      console.error('載入折扣失敗:', error);
      showAlert({ type: 'error', message: '載入折扣失敗' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateAll()) {
      showAlert({ type: 'warning', message: '請檢查表單錯誤' });
      return;
    }

    if (new Date(values.endDatetime) <= new Date(values.startDatetime)) {
      showAlert({ type: 'error', message: '結束時間必須晚於開始時間' });
      return;
    }

    setSaving(true);
    try {
      const baseData = {
        discount_code: `SYSTEM_${values.discountType.toUpperCase()}_${Date.now()}`,
        discount_type: values.discountType,
        name: values.name,
        description: values.description || '',
        min_purchase_amount: Number(values.minPurchaseAmount),
        start_datetime: values.startDatetime,
        end_datetime: values.endDatetime,
        is_active: values.isActive,
        usage_limit: null,
      };

      const discountData =
        values.discountType === 'seasonal'
          ? {
              ...baseData,
              discount_rate: Number(values.discountRate),
              max_discount_amount: values.maxDiscountAmount
                ? Number(values.maxDiscountAmount)
                : undefined,
            }
          : {
              ...baseData,
              discount_amount: Number(values.discountAmount),
            };

      if (isEditMode && discountId) {
        await adminService.updateSystemDiscount(discountId, discountData as any);
        showAlert({ type: 'success', message: '折扣已更新' });
      } else {
        await adminService.createSystemDiscount(discountData as any);
        showAlert({ type: 'success', message: '折扣已創建' });
      }

      setTimeout(() => navigate('/admin/discounts'), 1500);
    } catch (error) {
      console.error('儲存折扣失敗:', error);
      showAlert({ type: 'error', message: '儲存失敗，請稍後再試' });
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
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/discounts")}
          className={styles.backButton}
        >
          <Icon icon="arrow-left" />
          返回列表
        </Button>
        <h1 className={styles.pageTitle}>
          {isEditMode ? "編輯系統折扣" : "新增系統折扣"}
        </h1>
      </div>

      {/* Alert */}
      {alert && (
        <div ref={alertRef}>
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      <div className={styles.formContainer}>
        {/* 折扣類型 */}
        {!isEditMode && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>折扣類型</h2>
            <div className={styles.typeSelection}>
              <button
                type="button"
                className={`${styles.typeButton} ${
                  values.discountType === "seasonal" ? styles.active : ""
                }`}
                onClick={() => handleChange("discountType", "seasonal")}
              >
                <Icon icon="ticket" />
                <span>季節性折扣</span>
                <p className={styles.typeDesc}>百分比折扣優惠</p>
              </button>
              <button
                type="button"
                className={`${styles.typeButton} ${
                  values.discountType === "shipping" ? styles.active : ""
                }`}
                onClick={() => handleChange("discountType", "shipping")}
              >
                <Icon icon="truck-fast" />
                <span>免運費</span>
                <p className={styles.typeDesc}>運費折抵優惠</p>
              </button>
            </div>
          </section>
        )}

        {/* 基本資訊 */}
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
            placeholder="例如：春季折扣"
          />

          <div className={styles.formGroup}>
            <label className={styles.label}>描述</label>
            <textarea
              name="description"
              value={values.description}
              onChange={(e) => handleChange("description", e.target.value)}
              onBlur={() => handleBlur("description")}
              className={styles.textarea}
              rows={3}
              placeholder="請輸入折扣活動描述"
            />
            {errors.description && (
              <span className={styles.errorText}>{errors.description}</span>
            )}
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={values.isActive}
                onChange={(e) =>
                  handleChange("isActive", e.target.checked.toString())
                }
              />
              <span>立即啟用此折扣</span>
            </label>
          </div>
        </section>

        {/* 折扣設定 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>折扣設定</h2>

          {values.discountType === "seasonal" ? (
            <>
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
            </>
          ) : (
            <FormInput
              label="折抵金額"
              name="discountAmount"
              type="number"
              value={values.discountAmount}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.discountAmount}
              required
              placeholder="30"
              min={0}
              help="運費折抵金額（NT$）"
            />
          )}

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
        </section>

        {/* 有效期間 */}
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

        {/* 操作按鈕 */}
        <div className={styles.actions}>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/discounts")}
          >
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "儲存中..." : "儲存折扣"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DiscountEdit;
