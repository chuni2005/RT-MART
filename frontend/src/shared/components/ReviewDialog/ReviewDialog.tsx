import { useState, ChangeEvent } from 'react';
import Dialog from '@/shared/components/Dialog';
import Button from '@/shared/components/Button';
import Icon from '@/shared/components/Icon';
import Alert from '@/shared/components/Alert';
import type { ReviewDialogProps } from '@/types';
import { createReview } from '@/shared/services/reviewService';
import styles from './ReviewDialog.module.scss';

interface ReviewImage {
  file: File;
  preview: string;
}

function ReviewDialog({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  onSubmitSuccess,
}: ReviewDialogProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [images, setImages] = useState<ReviewImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const MAX_IMAGES = 5;
  const MAX_COMMENT_LENGTH = 500;

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleRatingHover = (value: number) => {
    setHoverRating(value);
  };

  const handleRatingLeave = () => {
    setHoverRating(0);
  };

  const handleCommentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_COMMENT_LENGTH) {
      setComment(value);
      setError('');
    }
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ReviewImage[] = [];
    const remainingSlots = MAX_IMAGES - images.length;

    if (files.length > remainingSlots) {
      setError(`最多只能上傳 ${MAX_IMAGES} 張圖片`);
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setError('請上傳圖片檔案');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('圖片大小不能超過 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        newImages.push({ file, preview });

        if (newImages.length === files.length) {
          setImages([...images, ...newImages]);
          setError('');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // 驗證評分是必填
    if (rating === 0) {
      setError('請選擇評分');
      return;
    }

    // 驗證評價內容是必填，且至少 10 個字
    if (comment.trim().length === 0) {
      setError('請輸入評價內容');
      return;
    }

    if (comment.trim().length < 10) {
      setError('評價內容至少需要 10 個字');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 構建 FormData
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('rating', rating.toString());
      formData.append('comment', comment.trim());

      // 添加圖片
      images.forEach((image) => {
        formData.append('images', image.file);
      });

      // 提交評價
      await createReview(formData);

      // 成功後重置表單並關閉
      handleReset();
      onClose();

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      setError((err as Error).message || '提交評價失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setRating(0);
    setHoverRating(0);
    setComment('');
    setImages([]);
    setError('');
  };

  const handleClose = () => {
    if (!isSubmitting) {
      handleReset();
      onClose();
    }
  };

  const getRatingText = (value: number): string => {
    const texts = ['', '非常不滿意', '不滿意', '一般', '滿意', '非常滿意'];
    return texts[value] || '';
  };

  const displayRating = hoverRating || rating;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      type="custom"
      title="撰寫評價"
      className={styles.reviewDialog}
      closeOnOverlayClick={!isSubmitting}
      closeOnEsc={!isSubmitting}
    >
      <div className={styles.reviewContent}>
        {/* 商品資訊 */}
        <div className={styles.productInfo}>
          {productImage && (
            <img
              src={productImage}
              alt={productName}
              className={styles.productImage}
            />
          )}
          <div className={styles.productName}>{productName}</div>
        </div>

        {/* 評分區域 */}
        <div className={styles.ratingSection}>
          <label className={styles.label}>評分 *</label>
          <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`${styles.star} ${
                  value <= displayRating ? styles.active : ''
                }`}
                onClick={() => handleRatingClick(value)}
                onMouseEnter={() => handleRatingHover(value)}
                onMouseLeave={handleRatingLeave}
                disabled={isSubmitting}
                aria-label={`${value} 星`}
              >
                <Icon
                  icon={value <= displayRating ? 'star' : 'star'}
                  className={value <= displayRating ? styles.filled : styles.empty}
                />
              </button>
            ))}
          </div>
          {displayRating > 0 && (
            <div className={styles.ratingText}>{getRatingText(displayRating)}</div>
          )}
        </div>

        {/* 評價內容 */}
        <div className={styles.commentSection}>
          <label className={styles.label} htmlFor="review-comment">
            評價內容 *
          </label>
          <textarea
            id="review-comment"
            className={styles.textarea}
            placeholder="分享您的使用心得，幫助其他買家做出更好的選擇（至少 10 個字）"
            value={comment}
            onChange={handleCommentChange}
            disabled={isSubmitting}
            rows={6}
          />
          <div className={styles.commentCounter}>
            {comment.length} / {MAX_COMMENT_LENGTH}
          </div>
        </div>

        {/* 圖片上傳 */}
        <div className={styles.imageSection}>
          <label className={styles.label}>上傳圖片（選填，最多 {MAX_IMAGES} 張）</label>

          <div className={styles.imageList}>
            {images.map((image, index) => (
              <div key={index} className={styles.imageItem}>
                <img src={image.preview} alt={`評價圖片 ${index + 1}`} />
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleRemoveImage(index)}
                  disabled={isSubmitting}
                  aria-label="刪除圖片"
                >
                  <Icon icon="times" />
                </button>
              </div>
            ))}

            {images.length < MAX_IMAGES && (
              <label className={styles.uploadButton}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  disabled={isSubmitting}
                  className={styles.fileInput}
                />
                <Icon icon="camera" />
                <span>上傳圖片</span>
              </label>
            )}
          </div>
          <div className={styles.imageHint}>
            支援 JPG、PNG 格式，單張圖片不超過 5MB
          </div>
        </div>

        {/* 錯誤提示 */}
        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} />
        )}

        {/* 操作按鈕 */}
        <div className={styles.actions}>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            fullWidth
          >
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            fullWidth
          >
            {isSubmitting ? '提交中...' : '提交評價'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default ReviewDialog;
