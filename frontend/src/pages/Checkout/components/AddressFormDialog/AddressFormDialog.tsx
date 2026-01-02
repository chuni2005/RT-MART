import { useEffect } from "react";
import Dialog from "@/shared/components/Dialog";
import FormInput from "@/shared/components/FormInput";
import Select from "@/shared/components/Select";
import Button from "@/shared/components/Button";
import { useForm } from "@/shared/hooks/useForm";
import {
  cityOptions,
  getDistrictsByCity,
} from "@/shared/utils/taiwanAddressData";
import { validatePhone, validatePostalCode } from "@/shared/utils/validation";
import styles from "./AddressFormDialog.module.scss";

export interface AddressFormData {
  recipientName: string;
  phone: string;
  city: string;
  district: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
  isDefault: boolean;
}

interface AddressFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddressFormData) => void;
  initialData?: Partial<AddressFormData>;
  mode?: "add" | "edit";
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
  mode = "add",
}: AddressFormDialogProps) {
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    reset,
    setValue,
    clearFieldError,
  } = useForm<AddressFormData>(
    {
      recipientName: initialData?.recipientName || "",
      phone: initialData?.phone || "",
      city: initialData?.city || "",
      district: initialData?.district || "",
      postalCode: initialData?.postalCode || "",
      addressLine1: initialData?.addressLine1 || "",
      addressLine2: initialData?.addressLine2 || "",
      isDefault: initialData?.isDefault || false,
    },
    async (formValues) => {
      onSubmit(formValues);
      onClose();
      reset();
    },
    {
      recipientName: (value) => (!value.trim() ? "請輸入收件人姓名" : null),
      phone: (value) => {
        if (!value.trim()) return "請輸入聯絡電話";
        return validatePhone(value);
      },
      city: (value) => (!value ? "請選擇城市" : null),
      district: (value) => (!value ? "請選擇區域" : null),
      postalCode: (value) => {
        if (!value.trim()) return "請輸入郵遞區號";
        return validatePostalCode(value);
      },
      addressLine1: (value) => (!value.trim() ? "請輸入詳細地址" : null),
    }
  );

  // 當 initialData 變化時更新表單
  useEffect(() => {
    if (isOpen && initialData) {
      setValue("recipientName", initialData.recipientName || "");
      setValue("phone", initialData.phone || "");
      setValue("city", initialData.city || "");
      setValue("district", initialData.district || "");
      setValue("postalCode", initialData.postalCode || "");
      setValue("addressLine1", initialData.addressLine1 || "");
      setValue("addressLine2", initialData.addressLine2 || "");
      setValue("isDefault", initialData.isDefault || false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData]);

  const handleCityChange = (value: string) => {
    setValue("city", value);
    setValue("district", ""); // 清空區域選擇
    clearFieldError("city");
  };

  const handleDistrictChange = (value: string) => {
    setValue("district", value);
    clearFieldError("district");
  };

  const districtOptions = getDistrictsByCity(values.city);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "add" ? "新增收件地址" : "編輯收件地址"}
      type="custom"
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* 收件人姓名 */}
        <FormInput
          label="收件人姓名"
          name="recipientName"
          value={values.recipientName}
          onChange={handleChange}
          error={errors.recipientName}
          required
          fieldName="收件人姓名"
        />

        {/* 聯絡電話 */}
        <FormInput
          label="聯絡電話"
          name="phone"
          type="tel"
          value={values.phone}
          onChange={handleChange}
          placeholder="0912-345-678"
          error={errors.phone}
          required
          fieldName="聯絡電話"
        />

        {/* 城市選擇 */}
        <div className={styles.formGroup}>
          <label>
            城市 <span className={styles.required}>*</span>
          </label>
          <Select
            options={cityOptions}
            value={values.city}
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
            value={values.district}
            onChange={handleDistrictChange}
            placeholder="請選擇區域"
            disabled={!values.city}
          />
          {errors.district && (
            <span className={styles.errorMessage}>{errors.district}</span>
          )}
        </div>

        {/* 郵遞區號 */}
        <FormInput
          label="郵遞區號"
          name="postalCode"
          value={values.postalCode}
          onChange={handleChange}
          placeholder="100"
          error={errors.postalCode}
          required
          fieldName="郵遞區號"
        />

        {/* 詳細地址 */}
        <FormInput
          label="詳細地址"
          name="addressLine1"
          value={values.addressLine1}
          onChange={handleChange}
          placeholder="路名、門牌、巷弄等"
          error={errors.addressLine1}
          required
          fieldName="詳細地址"
        />

        {/* 樓層/室 (選填) */}
        <FormInput
          label="樓層/室 (選填)"
          name="addressLine2"
          value={values.addressLine2 || ""}
          onChange={handleChange}
          placeholder="5 樓、B 室等"
          fieldName="樓層/室"
        />

        {/* 設為預設地址 */}
        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="isDefault"
            name="isDefault"
            checked={values.isDefault}
            onChange={handleChange}
          />
          <label htmlFor="isDefault">設為預設地址</label>
        </div>

        {/* 表單按鈕 */}
        <div className={styles.formActions}>
          <Button variant="outline" type="button" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" type="submit">
            {mode === "add" ? "新增" : "儲存"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default AddressFormDialog;
