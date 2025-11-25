/**
 * PasswordStrength Component - 密碼強度指示器
 * 顯示密碼強度等級和提示
 */

import { calculatePasswordStrength } from '../../../shared/utils/validation';
import styles from './PasswordStrength.module.scss';

const PasswordStrength = ({ password }) => {
  if (!password) return null;

  const { level, score } = calculatePasswordStrength(password);

  // 強度等級文字
  const levelText = {
    weak: '弱', // TODO: i18n
    medium: '中', // TODO: i18n
    strong: '強', // TODO: i18n
  };

  // 強度提示
  const hints = {
    weak: '密碼太簡單，建議加強', // TODO: i18n
    medium: '密碼強度適中', // TODO: i18n
    strong: '密碼強度良好', // TODO: i18n
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
