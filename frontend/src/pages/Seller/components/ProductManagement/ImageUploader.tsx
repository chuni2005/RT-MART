import { useState, DragEvent, ChangeEvent } from "react";
import Icon from "@/shared/components/Icon";
import Button from "@/shared/components/Button";
import { ProductImage } from "@/types/seller";
import styles from "./ImageUploader.module.scss";

interface ImageUploaderProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  onRemove?: (image: ProductImage) => void;
  maxImages?: number;
}

function ImageUploader({
  images,
  onChange,
  onRemove,
  maxImages = 5,
}: ImageUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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

    // 判斷是否為外部檔案拖入
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    }
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
      if (!file.type.startsWith("image/")) {
        alert("請上傳圖片檔案");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ProductImage = {
          imageUrl: e.target?.result as string,
          displayOrder: images.length,
          file, // 儲存原始檔案物件
        };
        onChange([...images, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = (index: number) => {
    const imageToRemove = images[index];

    // 如果有提供 onRemove 回呼，先執行它（例如呼叫 API 刪除後端圖片）
    if (onRemove) {
      onRemove(imageToRemove);
    }

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
    [newImages[index - 1], newImages[index]] = [
      newImages[index],
      newImages[index - 1],
    ];
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      displayOrder: i,
    }));
    onChange(reorderedImages);
  };

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [
      newImages[index + 1],
      newImages[index],
    ];
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      displayOrder: i,
    }));
    onChange(reorderedImages);
  };

  // 內部圖片拖拽排序
  const handleItemDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // 設置拖拽預覽圖（可選）
  };

  const handleItemDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    // 可以在這裡實作即時交換位置的視覺效果，但為了簡單我們先在 drop 時處理
  };

  const handleItemDrop = (
    e: DragEvent<HTMLDivElement>,
    targetIndex: number
  ) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];

    // 移除拖拽項目並插入到新位置
    newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedItem);

    // 重新計算 displayOrder
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      displayOrder: i,
    }));

    onChange(reorderedImages);
    setDraggedIndex(null);
  };

  const handleItemDragEnd = () => {
    setDraggedIndex(null);
  };

  const sortedImages = [...images].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  return (
    <div className={styles.imageUploader}>
      {/* 上傳區域 */}
      {images.length < maxImages && (
        <div
          className={`${styles.uploadZone} ${dragOver ? styles.dragOver : ""}`}
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
      {sortedImages.length > 0 && (
        <div className={styles.imageList}>
          {sortedImages.map((image, index) => (
            <div
              key={index}
              className={`${styles.imageItem} ${
                draggedIndex === index ? styles.dragging : ""
              }`}
              draggable
              onDragStart={(e) => handleItemDragStart(e, index)}
              onDragOver={(e) => handleItemDragOver(e, index)}
              onDrop={(e) => handleItemDrop(e, index)}
              onDragEnd={handleItemDragEnd}
            >
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
