import { useState, useEffect } from 'react';
import styles from './ImageGallery.module.scss';
import Button from '../../../shared/components/Button';
import Icon from "../../../shared/components/Icon/Icon";

interface ImageGalleryProps {
  images: string[];
}

function ImageGallery({ images }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // 切換到上一張圖片
  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  // 切換到下一張圖片
  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  // 點擊縮圖切換主圖
  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  // 開啟 Lightbox
  const openLightbox = () => {
    setIsLightboxOpen(true);
  };

  // 關閉 Lightbox
  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  // Lightbox 中的切換邏輯
  const handleLightboxPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    handlePrevious();
  };

  const handleLightboxNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleNext();
  };

  // 鍵盤導航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          if (isLightboxOpen) {
            closeLightbox();
          }
          break;
        default:
          break;
      }
    };

    // 添加鍵盤事件監聽
    window.addEventListener('keydown', handleKeyDown);

    // 清理函數：移除事件監聽
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, images.length]);

  // 如果沒有圖片，顯示預設佔位符
  if (!images || images.length === 0) {
    return (
      <div className={styles.imageGallery}>
        <div className={styles.mainImage}>
          <div className={styles.placeholder}>暫無圖片</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.imageGallery}>
        {/* 主圖區 */}
        <div className={styles.mainImageContainer}>
          <Button
            iconOnly
            icon="chevron-left"
            onClick={handlePrevious}
            ariaLabel="上一張圖片"
            className={`${styles.navButton} ${styles.navButtonLeft}`}
          />

          <div className={styles.mainImage} onClick={openLightbox}>
            <img src={images[currentIndex]} alt={`商品圖片 ${currentIndex + 1}`} />
            <div className={styles.zoomHint}>點擊放大檢視</div>
          </div>

          <Button
            iconOnly
            icon="chevron-right"
            onClick={handleNext}
            ariaLabel="下一張圖片"
            className={`${styles.navButton} ${styles.navButtonRight}`}
          />
        </div>

        {/* 縮圖列表 */}
        <div className={styles.thumbnailContainer}>
          {images.map((image, index) => (
            <div
              key={index}
              className={`${styles.thumbnail} ${index === currentIndex ? styles.active : ''}`}
              onClick={() => handleThumbnailClick(index)}
            >
              <img src={image} alt={`縮圖 ${index + 1}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox 放大檢視 */}
      {isLightboxOpen && (
        <div className={styles.lightbox} onClick={closeLightbox}>
          <Button
            iconOnly
            icon="times"
            onClick={closeLightbox}
            ariaLabel="關閉"
            className={styles.closeButton}
          />

          <Button
            iconOnly
            icon="chevron-left"
            onClick={handleLightboxPrevious}
            ariaLabel="上一張圖片"
            className={`${styles.lightboxNavButton} ${styles.lightboxNavButtonLeft}`}
          />

          <div className={styles.lightboxImage}>
            <img src={images[currentIndex]} alt={`放大檢視 ${currentIndex + 1}`} />
          </div>

          <Button
            iconOnly
            icon="chevron-right"
            onClick={handleLightboxNext}
            ariaLabel="下一張圖片"
            className={`${styles.lightboxNavButton} ${styles.lightboxNavButtonRight}`}
          />

          <div className={styles.lightboxCounter}>
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}

export default ImageGallery;
