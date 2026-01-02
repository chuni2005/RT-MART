import React, { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import styles from './VerificationCodeInput.module.scss';

interface VerificationCodeInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error,
  className = '',
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [values, setValues] = useState<string[]>(Array(length).fill(''));

  // Sync internal state with external value prop
  useEffect(() => {
    const newValues = value.padEnd(length, '').split('').slice(0, length);
    setValues(newValues);
  }, [value, length]);

  const handleChange = (index: number, inputValue: string) => {
    if (disabled) return;

    // Only allow digits
    const digit = inputValue.replace(/\D/g, '');
    if (!digit) return;

    const newValues = [...values];
    newValues[index] = digit[digit.length - 1]; // Take last digit if multiple
    setValues(newValues);

    const newCode = newValues.join('');
    onChange(newCode);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete when all digits are entered
    if (newCode.length === length && onComplete) {
      onComplete(newCode);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      if (!values[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newValues = [...values];
        newValues[index] = '';
        setValues(newValues);
        onChange(newValues.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, length);

    if (digits) {
      const newValues = digits.padEnd(length, '').split('');
      setValues(newValues);
      onChange(digits);

      // Focus last filled input
      const lastIndex = Math.min(digits.length, length - 1);
      inputRefs.current[lastIndex]?.focus();

      // Call onComplete if all digits are filled
      if (digits.length === length && onComplete) {
        onComplete(digits);
      }
    }
  };

  const handleFocus = (index: number) => {
    inputRefs.current[index]?.select();
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.inputGroup}>
        {Array.from({ length }, (_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={values[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            disabled={disabled}
            className={`${styles.input} ${error ? styles.error : ''}`}
            aria-label={`驗證碼第 ${index + 1} 位數字`}
          />
        ))}
      </div>
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};

export default VerificationCodeInput;
