/**
 * PasswordStrength Component - 密碼強度指示器
 * 顯示密碼強度等級和提示
 */

import { calculatePasswordStrength } from '@/shared/utils/validation';
import styles from './PasswordStrength.module.scss';
import { useTranslation } from 'react-i18next';

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  if (!password) return null;

  const { level, score } = calculatePasswordStrength(password);
  const { t } = useTranslation();

  const levelText: Record<typeof level, string> = {
    weak: t('passwordStrength.level.weak'),
    medium: t('passwordStrength.level.medium'),
    strong: t('passwordStrength.level.strong'),
  };

  const hints: Record<typeof level, string> = {
    weak: t('passwordStrength.hint.weak'),
    medium: t('passwordStrength.hint.medium'),
    strong: t('passwordStrength.hint.strong'),
  };

  return (
    <div className={styles.passwordStrength}>
      {/* 強度條 */}
      <div className={styles.strengthBar}>
        <div className={`${styles.bar} ${styles[level]}`} style={{ width: `${(score / 6) * 100}%` }} />
      </div>

      {/* 強度文字 */}
      <div className={styles.strengthInfo}>
        <span className={`${styles.level} ${styles[level]}`}>
          {levelText[level]}
        </span>
        <span className={styles.hint}>{hints[level]}</span>
      </div>
    </div>
  );
};

export default PasswordStrength;
