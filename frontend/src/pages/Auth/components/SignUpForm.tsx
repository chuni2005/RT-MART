/**
 * SignUpForm Component - 註冊表單
 * 功能：用戶名 + Email + 電話 + Password + 確認密碼 + 密碼強度檢查
 * 注意：註冊時 name = loginId，後續可透過個人設定更改 name
 */

import { useState, ChangeEvent, FocusEvent, FormEvent } from "react";
import FormInput from "@/shared/components/FormInput";
import PasswordStrength from "./PasswordStrength";
import {
  validateUsername,
  validateEmail,
  validatePhone,
  validatePasswordStrength,
  validateConfirmPassword,
} from "@/shared/utils/validation";
import styles from "./SignUpForm.module.scss";

interface SignUpFormProps {
  onSubmit: (formData: SignUpFormData) => Promise<void>;
  isLoading: boolean;
}

interface SignUpFormData {
  loginId: string;
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface FormData {
  loginId: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface FormErrors {
  loginId?: string | null;
  email?: string | null;
  phone?: string | null;
  password?: string | null;
  confirmPassword?: string | null;
  agreeTerms?: string | null;
}

const SignUpForm = ({ onSubmit, isLoading }: SignUpFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    loginId: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    if (name === "password" && touched.confirmPassword) {
      const confirmError = validateConfirmPassword(
        value as string,
        formData.confirmPassword
      );
      setErrors((prev) => ({
        ...prev,
        confirmPassword: confirmError,
      }));
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    validateField(name, value);
  };

  const validateField = (name: string, value: string): string | null => {
    let error: string | null = null;

    switch (name) {
      case "loginId":
        error = validateUsername(value);
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "phone":
        error = validatePhone(value);
        break;
      case "password":
        error = validatePasswordStrength(value);
        break;
      case "confirmPassword":
        error = validateConfirmPassword(formData.password, value);
        break;
      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    return error;
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {
      loginId: validateUsername(formData.loginId),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      password: validatePasswordStrength(formData.password),
      confirmPassword: validateConfirmPassword(
        formData.password,
        formData.confirmPassword
      ),
    };

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "請同意服務條款與隱私政策";
    }

    setErrors(newErrors);
    setTouched({
      loginId: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    });

    return (
      !newErrors.loginId &&
      !newErrors.email &&
      !newErrors.phone &&
      !newErrors.password &&
      !newErrors.confirmPassword &&
      !newErrors.agreeTerms
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateAll()) {
      return;
    }

    try {
      await onSubmit({
        loginId: formData.loginId,
        name: formData.loginId,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
    } catch (error) {
      console.error("SignUp form error:", error);
    }
  };

  return (
    <form className={styles.signUpForm} onSubmit={handleSubmit}>
      <FormInput
        label="用戶名"
        type="text"
        name="loginId"
        value={formData.loginId}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.loginId ? errors.loginId ?? undefined : undefined}
        placeholder="4-20 個英數字"
        disabled={isLoading}
        autoComplete="username"
        required
      />

      <FormInput
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.email ? errors.email ?? undefined : undefined}
        placeholder="請輸入您的 Email"
        disabled={isLoading}
        autoComplete="email"
        required
      />

      <FormInput
        label="電話號碼"
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.phone ? errors.phone ?? undefined : undefined}
        placeholder="0912-345-678"
        disabled={isLoading}
        autoComplete="tel"
        required
      />

      <FormInput
        label="密碼"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password ? errors.password ?? undefined : undefined}
        placeholder="請輸入密碼（至少 8 碼，含大小寫及數字）"
        disabled={isLoading}
        autoComplete="new-password"
        required
      />

      {formData.password && <PasswordStrength password={formData.password} />}

      <FormInput
        label="確認密碼"
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        onBlur={handleBlur}
        error={
          touched.confirmPassword
            ? errors.confirmPassword ?? undefined
            : undefined
        }
        placeholder="請再次輸入密碼"
        disabled={isLoading}
        autoComplete="new-password"
        required
      />

      <div className={styles.termsContainer}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={handleChange}
            disabled={isLoading}
          />
          <span>
            我同意 <a href="#">服務條款</a> 與 <a href="#">隱私政策</a>
          </span>
        </label>
        {touched.agreeTerms && errors.agreeTerms && (
          <div className={styles.error}>{errors.agreeTerms}</div>
        )}
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isLoading}
      >
        {isLoading ? "註冊中..." : "註冊"}
      </button>
    </form>
  );
};

export default SignUpForm;
