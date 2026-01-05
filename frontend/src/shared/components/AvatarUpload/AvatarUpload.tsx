/**
 * AvatarUpload Component - 头像上传组件
 * 支持本地预览和文件验证
 */
import { useState, useRef, ChangeEvent } from 'react';
import styles from './AvatarUpload.module.scss';

interface AvatarUploadProps {
  value?: string | File;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  error?: string;
}

const AvatarUpload = ({ value, onChange, disabled, error }: AvatarUploadProps) => {
  const [preview, setPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小 (最大 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      alert('图片大小不能超过 2MB');
      return;
    }

    // 创建预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 通知父组件
    onChange(file);
  };

  // 点击触发文件选择
  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // 移除头像
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview('');
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 获取显示的图片
  const displayImage = preview || (typeof value === 'string' ? value : '');

  return (
    <div className={styles.avatarUpload}>
      <div
        className={`${styles.uploadArea} ${disabled ? styles.disabled : ''} ${error ? styles.error : ''}`}
        onClick={handleClick}
      >
        {displayImage ? (
          <div className={styles.preview}>
            <img src={displayImage} alt="Avatar preview" />
            {!disabled && (
              <button
                type="button"
                className={styles.removeButton}
                onClick={handleRemove}
              >
                ×
              </button>
            )}
          </div>
        ) : (
          <div className={styles.placeholder}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className={styles.text}>点击上传头像</span>
            <span className={styles.hint}>支持 JPG、PNG，最大 2MB</span>
          </div>
        )}
      </div>

      {error && <div className={styles.errorText}>{error}</div>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
        className={styles.hiddenInput}
      />
    </div>
  );
};

export default AvatarUpload;
