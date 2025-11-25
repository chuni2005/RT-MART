/**
 * Alert Component - 訊息提示組件
 * 支援：success / error / info / warning 四種類型
 */

import Icon from '../Icon';
import styles from './Alert.module.scss';
import type { AlertType, AlertProps } from '@/types';

const iconMap: Record<AlertType, string> = {
  success: 'check-circle',
  error: 'exclamation-circle',
  info: 'info-circle',
  warning: 'exclamation-triangle',
};

const Alert = ({ type = 'info', message, onClose, className }: AlertProps) => {
  if (!message) return null;

  const icon = iconMap[type] || iconMap.info;

  return (
    <div className={`${styles.alert} ${styles[type]} ${className || ''}`} role="alert">
      {/* Icon */}
      <div className={styles.icon}>
        <Icon icon={icon} />
      </div>

      {/* Message */}
      <div className={styles.message}>{message}</div>

      {/* Close Button*/}
      {onClose && (
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="關閉訊息" // TODO: i18n
        >
          <Icon icon="times" />
        </button>
      )}
    </div>
  );
};

export default Alert;
