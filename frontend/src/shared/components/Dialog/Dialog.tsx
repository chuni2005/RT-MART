import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { DialogProps } from '@/types';
import Button from '@/shared/components/Button';
import Icon from '@/shared/components/Icon';
import styles from './Dialog.module.scss';

function Dialog({
  isOpen,
  onClose,
  title,
  message,
  type = 'confirm',
  confirmText = '確定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  variant = 'info',
  icon,
  mediaUrl,
  mediaType,
  children,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className = '',
  textAlign = 'center',
}: DialogProps) {
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // 圖標映射
  const defaultIcons = {
    danger: 'exclamation-triangle',
    warning: 'exclamation-triangle',
    info: 'info-circle',
  };

  const displayIcon = icon || defaultIcons[variant];

  // 文字對齊類
  const getTextAlignClass = () => {
    switch (textAlign) {
      case 'left':
        return styles.textLeft;
      case 'right':
        return styles.textRight;
      case 'center':
      default:
        return styles.textCenter;
    }
  };

  // 自動偵測媒體類型
  const getMediaType = (): 'image' | 'video' | null => {
    if (!mediaUrl) return null;
    if (mediaType) return mediaType;

    const ext = mediaUrl.split('.').pop()?.toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoExts = ['mp4', 'webm', 'ogg', 'mov'];

    if (imageExts.includes(ext || '')) return 'image';
    if (videoExts.includes(ext || '')) return 'video';
    return 'image'; // 預設為圖片
  };

  const detectedMediaType = getMediaType();

  // ESC 鍵關閉
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  // 焦點管理
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      dialogRef.current?.focus();
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // 點擊遮罩關閉
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  // 取消按鈕
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  // 確認按鈕
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className={styles.dialogOverlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
      aria-describedby={message ? 'dialog-message' : undefined}
    >
      <div
        ref={dialogRef}
        className={`${styles.dialogContent} ${
          className ? className : ''
        } ${styles[variant]} ${getTextAlignClass()}`}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={styles.dialogHeader}>
            {title && (
              <h3 id="dialog-title" className={styles.dialogTitle}>
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="關閉對話框"
              >
                <Icon icon="times" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={styles.dialogBody}>
          {type === 'custom' ? (
            children
          ) : (
            <>
              {/* 優先顯示媒體，其次顯示圖標 */}
              {mediaUrl ? (
                <div className={styles.mediaWrapper}>
                  {detectedMediaType === 'video' ? (
                    <video
                      src={mediaUrl}
                      className={styles.media}
                      autoPlay
                      loop
                      muted
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="Dialog media"
                      className={styles.media}
                    />
                  )}
                </div>
              ) : (
                displayIcon && (
                  <div className={styles.iconWrapper}>
                    <Icon icon={displayIcon} className={styles.icon} />
                  </div>
                )
              )}
              {message && (
                <p id="dialog-message" className={styles.message}>
                  {message}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {type !== 'custom' && (
          <div className={styles.dialogFooter}>
            {type === 'confirm' && (
              <Button variant="outline" onClick={handleCancel}>
                {cancelText}
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleConfirm}
              className={styles.confirmButton}
            >
              {confirmText}
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default Dialog;
