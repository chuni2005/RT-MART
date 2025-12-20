import { useState, DragEvent, ChangeEvent } from 'react';
import Icon from '@/shared/components/Icon';
import Button from '@/shared/components/Button';
import { ProductImage } from '@/types/seller';
import styles from './ImageUploader.module.scss';

interface ImageUploaderProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

function ImageUploader({ images, onChange, maxImages = 5 }: ImageUploaderProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    if (images.length + files.length > maxImages) {
      alert(`最多只能上傳 ${maxImages} 張圖片`);
      return;
    }

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert('請上傳圖片檔案');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ProductImage = {
          imageUrl: e.target?.result as string,
          displayOrder: images.length,
        };
        onChange([...images, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // 重新排序
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      displayOrder: i,
    }));
    onChange(reorderedImages);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      displayOrder: i,
    }));
    onChange(reorderedImages);
  };

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      displayOrder: i,
    }));
    onChange(reorderedImages);
  };

  return (
    <div className={styles.imageUploader}>
      {/* 上傳區域 */}
      {images.length < maxImages && (
        <div
          className={`${styles.uploadZone} ${dragOver ? styles.dragOver : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Icon icon="cloud-upload" className={styles.uploadIcon} />
          <p className={styles.uploadText}>拖曳圖片至此或點擊上傳</p>
          <p className={styles.uploadHint}>
            支援 JPG、PNG 格式，最多 {maxImages} 張
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className={styles.fileInput}
          />
        </div>
      )}

      {/* 圖片列表 */}
      {images.length > 0 && (
        <div className={styles.imageList}>
          {images.map((image, index) => (
            <div key={index} className={styles.imageItem}>
              <img src={image.imageUrl} alt={`商品圖片 ${index + 1}`} />
              {index === 0 && <div className={styles.mainBadge}>主圖</div>}
              <div className={styles.imageActions}>
                <Button
                  variant="ghost"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className={styles.actionButton}
                >
                  <Icon icon="arrow-up" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === images.length - 1}
                  className={styles.actionButton}
                >
                  <Icon icon="arrow-down" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleRemove(index)}
                  className={styles.actionButton}
                >
                  <Icon icon="trash" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
