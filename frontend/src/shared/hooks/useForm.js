/**
 * useForm Hook - 通用表單處理
 * 簡化表單狀態管理和驗證邏輯
 */

import { useState } from 'react';

/**
 * 自訂 Hook：表單處理
 * @param {object} initialValues - 初始表單值
 * @param {function} onSubmit - 提交處理函數
 * @param {object} validationRules - 驗證規則 { fieldName: validatorFunction }
 * @returns {object} 表單狀態和處理函數
 */
export const useForm = (initialValues = {}, onSubmit, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 處理輸入變更
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setValues(prev => ({
      ...prev,
      [name]: newValue,
    }));

    // 如果欄位已被觸碰過，即時驗證
    if (touched[name]) {
      validateField(name, newValue);
    }
  };

  /**
   * 處理 Blur 事件（欄位失焦）
   */
  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    // 驗證該欄位
    validateField(name, value);
  };

  /**
   * 驗證單一欄位
   */
  const validateField = (fieldName, value) => {
    if (validationRules[fieldName]) {
      const error = validationRules[fieldName](value, values);

      setErrors(prev => ({
        ...prev,
        [fieldName]: error,
      }));

      return error;
    }

    return null;
  };

  /**
   * 驗證所有欄位
   */
  const validateAll = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
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
    }, {});
    setTouched(allTouched);

    return isValid;
  };

  /**
   * 處理表單提交
   */
  const handleSubmit = async (e) => {
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
      console.error('Form submission error:', error);
      // 可以在這裡設置全域錯誤訊息
      setErrors(prev => ({
        ...prev,
        _form: error.message || '提交失敗，請稍後再試', // TODO: i18n
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
  const setValue = (fieldName, value) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  /**
   * 設定特定欄位的錯誤
   */
  const setFieldError = (fieldName, error) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  /**
   * 清除特定欄位的錯誤
   */
  const clearFieldError = (fieldName) => {
    setErrors(prev => {
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
