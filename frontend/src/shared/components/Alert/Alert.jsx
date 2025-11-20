/**
 * Alert Component - 訊息提示組件
 * 支援：success / error / info / warning 四種類型
 */

import Icon from '../Icon';
import {
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faExclamationTriangle,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import styles from './Alert.module.scss';

const iconMap = {
  success: faCheckCircle,
  error: faExclamationCircle,
  info: faInfoCircle,
  warning: faExclamationTriangle,
};

const Alert = ({ type = 'info', message, onClose, className }) => {
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

      {/* Close Button (可選) */}
      {onClose && (
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="關閉訊息" // TODO: i18n
        >
          <Icon icon={faTimes} />
        </button>
      )}
    </div>
  );
};

export default Alert;
