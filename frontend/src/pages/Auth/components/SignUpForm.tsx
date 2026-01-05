/**
 * SignUpForm Component - 兩步驟註冊表單
 * Step 1: 基本資料填寫
 * Step 2: Email 驗證碼驗證
 */
import { useState } from 'react';
import FormInput from "@/shared/components/FormInput";
import PasswordStrength from "./PasswordStrength";
import VerificationCodeInput from "@/shared/components/VerificationCodeInput/VerificationCodeInput";
import CountdownTimer from "@/shared/components/CountdownTimer/CountdownTimer";
import Button from "@/shared/components/Button";
import Alert from "@/shared/components/Alert";
import AvatarUpload from "@/shared/components/AvatarUpload";
import { useForm } from "@/shared/hooks/useForm";
import {
  validateUsername,
  validateEmail,
  validatePhone,
  validatePasswordStrength,
  validateConfirmPassword,
} from "@/shared/utils/validation";
import styles from "./SignUpForm.module.scss";
import { useTranslation } from 'react-i18next';

interface SignUpFormProps {
  onSendCode: (formData: SignUpFormData) => Promise<void>;
  onVerifyCode: (email: string, code: string) => Promise<void>;
  onResendCode: (email: string) => Promise<void>;
  isLoading: boolean;
}

interface SignUpFormData {
  loginId: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  avatarFile?: File | null;
}

interface FormData {
  loginId: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

const SignUpForm = ({ onSendCode, onVerifyCode, onResendCode, isLoading }: SignUpFormProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isCodeExpired, setIsCodeExpired] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const VERIFICATION_TIMEOUT = 300;
  
  const { t } = useTranslation()
  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isValid } =
    useForm<FormData>(
      {
        loginId: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        agreeTerms: false,
      },
      async (formValues) => {
        // Step 1: 發送驗證碼
        try {
          await onSendCode({
            loginId: formValues.loginId,
            name: formValues.loginId,
            email: formValues.email,
            phone: formValues.phone,
            password: formValues.password,
            avatarFile: avatarFile || undefined,
          });
          setStep(2);
          setIsCodeExpired(false);
          setCanResend(false);
          setTimerKey(prev => prev + 1);
          setAlertMessage({ type: 'success', message: '驗證碼已發送至您的 Email' });
        } catch (error: any) {
          setAlertMessage({ type: 'error', message: error.message || '發送驗證碼失敗' });
        }
      },
      {
        // 驗證規則
        loginId: (value) => validateUsername(value, t),
        email: (value) => validateEmail(value, t),
        phone: (value) => validatePhone(value, t),
        password: (value) => validatePasswordStrength(value, t),
        confirmPassword: (value, allValues) =>
          validateConfirmPassword(allValues.password, value, t),
        agreeTerms: (value) => (value ? null : t('signUpForm.errors.agreeTerms')),
      }
    );

  const handleVerifyCode = async (code: string) => {
    if (code.length !== 6) {
      setCodeError("請輸入完整的 6 位數驗證碼");
      return;
    }

    setCodeError("");
    try {
      await onVerifyCode(values.email, code);
      // 驗證成功，AuthContext 會處理登入和跳轉
    } catch (error: any) {
      setCodeError(error.message || "驗證碼錯誤或已過期");
      setVerificationCode("");
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    try {
      await onResendCode(values.email);
      setVerificationCode('');
      setCodeError('');
      setIsCodeExpired(false);
      setCanResend(false);
      setTimerKey(prev => prev + 1);
      setAlertMessage({ type: 'success', message: '驗證碼已重新發送' });
    } catch (error: any) {
      setAlertMessage({ type: 'error', message: error.message || '重新發送失敗' });
    }
  };

  const handleTimerExpire = () => {
    setIsCodeExpired(true);
    setCanResend(true);
    setAlertMessage({ type: 'error', message: '驗證碼已過期，請重新發送' });
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setVerificationCode('');
    setCodeError('');
    setIsCodeExpired(false);
    setCanResend(false);
    setAlertMessage(null);
  };

  if (step === 2) {
    return (
      <div className={styles.verificationStep}>
        {alertMessage && (
          <Alert
            type={alertMessage.type}
            message={alertMessage.message}
            onClose={() => setAlertMessage(null)}
          />
        )}

        <div className={styles.verificationHeader}>
          <h3>驗證您的 Email</h3>
          <p>
            我們已將驗證碼發送至 <strong>{values.email}</strong>
          </p>
        </div>

        <CountdownTimer
          key={timerKey}
          initialSeconds={VERIFICATION_TIMEOUT}
          onExpire={handleTimerExpire}
          className={styles.timer}
        />

        <div className={styles.codeInputContainer}>
          <VerificationCodeInput
            value={verificationCode}
            onChange={(code) => {
              setVerificationCode(code);
              setCodeError("");
            }}
            onComplete={handleVerifyCode}
            disabled={isLoading || isCodeExpired}
            error={codeError}
          />
        </div>

        <div className={styles.verificationActions}>
          <Button
            variant="primary"
            fullWidth
            onClick={() => handleVerifyCode(verificationCode)}
            disabled={
              isLoading || verificationCode.length !== 6 || isCodeExpired
            }
          >
            {isLoading ? "驗證中..." : "確認驗證"}
          </Button>

          <Button
            variant="outline"
            fullWidth
            onClick={handleResendCode}
            disabled={isLoading || !canResend}
          >
            重新發送驗證碼
          </Button>

          <Button
            variant="ghost"
            fullWidth
            onClick={handleBackToStep1}
            disabled={isLoading}
          >
            返回修改資料
          </Button>
        </div>
      </div>
    );
  }

  // Step 1: 基本資料表單
  return (
    <form className={styles.signUpForm} onSubmit={handleSubmit}>
      {alertMessage && (
        <Alert
          type={alertMessage.type}
          message={alertMessage.message}
          onClose={() => setAlertMessage(null)}
        />
      )}

      <AvatarUpload
        value={avatarFile || undefined}
        onChange={setAvatarFile}
        disabled={isLoading}
      />

      <FormInput
        label={t('signUpForm.labels.loginId')}
        type="text"
        name="loginId"
        value={values.loginId}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.loginId ? errors.loginId ?? undefined : undefined}
        placeholder={t('signUpForm.placeholders.loginId')}
        disabled={isLoading}
        autoComplete="username"
        required
        fieldName={t('signUpForm.labels.loginId')}
      />

      <FormInput
        label={t('signUpForm.labels.email')}
        type="email"
        name="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.email ? errors.email ?? undefined : undefined}
        placeholder={t('signUpForm.placeholders.email')}
        disabled={isLoading}
        autoComplete="email"
        required
        fieldName={t('signUpForm.labels.email')}
      />

      <FormInput
        label={t('signUpForm.labels.phone')}
        type="tel"
        name="phone"
        value={values.phone}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.phone ? errors.phone ?? undefined : undefined}
        placeholder={t('signUpForm.placeholders.phone')}
        disabled={isLoading}
        autoComplete="tel"
        required
        fieldName={t('signUpForm.labels.phone')}
      />

      <FormInput
        label={t('signUpForm.labels.password')}
        type="password"
        name="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password ? errors.password ?? undefined : undefined}
        placeholder={t('signUpForm.placeholders.password')}
        disabled={isLoading}
        autoComplete="new-password"
        required
        fieldName={t('signUpForm.labels.password')}
      />

      {values.password && <PasswordStrength password={values.password} />}

      <FormInput
        label={t('signUpForm.labels.confirmPassword')}
        type="password"
        name="confirmPassword"
        value={values.confirmPassword}
        onChange={handleChange}
        onBlur={handleBlur}
        error={
          touched.confirmPassword
            ? errors.confirmPassword ?? undefined
            : undefined
        }
        placeholder={t('signUpForm.placeholders.confirmPassword')}
        disabled={isLoading}
        autoComplete="new-password"
        required
        fieldName={t('signUpForm.labels.confirmPassword')}
      />

      <div className={styles.termsContainer}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            name="agreeTerms"
            checked={values.agreeTerms}
            onChange={handleChange}
            disabled={isLoading}
          />
          <span>
            {t('signUpForm.terms.agree')} <a href="#">{t('signUpForm.terms.arg1')}</a> {t('signUpForm.terms.and')} <a href="#">{t('signUpForm.terms.arg2')}</a>
          </span>
        </label>
        {touched.agreeTerms && errors.agreeTerms && (
          <div className={styles.error}>{errors.agreeTerms}</div>
        )}
      </div>

      <Button
        type="submit"
        fullWidth
        className={styles.submitButton}
        disabled={isLoading || !isValid}
      >
        {isLoading ? t('signUpForm.buttons.submitting') : t('signUpForm.buttons.submit')}
      </Button>
    </form>
  );
};

export default SignUpForm;
