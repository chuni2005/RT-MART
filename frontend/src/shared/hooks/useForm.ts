/**
 * useForm Hook - 通用表單處理
 * 簡化表單狀態管理和驗證邏輯
 */

import { useState, ChangeEvent, FocusEvent, FormEvent } from "react";

type ValidationRule<T = any> = (value: any, allValues: T) => string | null;

interface ValidationRules<T = any> {
  [key: string]: ValidationRule<T>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleBlur: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (
    e?: FormEvent<HTMLFormElement | HTMLTextAreaElement>
  ) => Promise<void>;
  reset: () => void;
  setValue: (fieldName: keyof T, value: any) => void;
  setFieldError: (fieldName: string, error: string | null) => void;
  clearFieldError: (fieldName: string) => void;
  validateField: (fieldName: keyof T, value: any) => string | null;
  validateAll: () => boolean;
}

/**
 * 自訂 Hook：表單處理
 * @param initialValues - 初始表單值
 * @param onSubmit - 提交處理函數
 * @param validationRules - 驗證規則 { fieldName: validatorFunction }
 * @returns 表單狀態和處理函數
 */
export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void> | void,
  validationRules: ValidationRules<T> = {}
): UseFormReturn<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 處理輸入變更
   */
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = "checked" in e.target ? e.target.checked : false;
    const newValue = type === "checkbox" ? checked : value;

    setValues((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // 如果欄位已被觸碰過，即時驗證
    if (touched[name]) {
      validateField(name as keyof T, newValue);
    }
  };

  /**
   * 處理 Blur 事件（欄位失焦）
   */
  const handleBlur = (
    e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // 驗證該欄位
    validateField(name as keyof T, value);
  };

  /**
   * 驗證單一欄位
   */
  const validateField = (fieldName: keyof T, value: any): string | null => {
    if (validationRules[fieldName as string]) {
      const error = validationRules[fieldName as string](value, values);

      setErrors((prev) => ({
        ...prev,
        [fieldName]: error || "",
      }));

      return error;
    }

    return null;
  };

  /**
   * 驗證所有欄位
   */
  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validationRules[fieldName](values[fieldName], values);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);

    // 標記所有欄位為已觸碰
    const allTouched = Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    return isValid;
  };

  /**
   * 處理表單提交
   */
  const handleSubmit = async (
    e?: FormEvent<HTMLFormElement | HTMLTextAreaElement>
  ) => {
    if (e) {
      e.preventDefault();
    }

    // 驗證所有欄位
    const isValid = validateAll();

    if (!isValid) {
      return;
    }

    // 執行提交邏輯
    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } catch (error) {
      console.error("Form submission error:", error);
      // 可以在這裡設置全域錯誤訊息
      setErrors((prev) => ({
        ...prev,
        _form: error instanceof Error ? error.message : "提交失敗，請稍後再試", // TODO: i18n
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 重置表單
   */
  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  /**
   * 設定特定欄位的值
   */
  const setValue = (fieldName: keyof T, value: any) => {
    setValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  /**
   * 設定特定欄位的錯誤
   */
  const setFieldError = (fieldName: string, error: string | null) => {
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error || "",
    }));
  };

  /**
   * 清除特定欄位的錯誤
   */
  const clearFieldError = (fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValue,
    setFieldError,
    clearFieldError,
    validateField,
    validateAll,
  };
};

export default useForm;
