import { useState } from 'react';
import styles from './ReviewSection.module.scss';
import Icon from '../../../shared/components/Icon/Icon';
import Button from '../../../shared/components/Button';
import Select from '../../../shared/components/Select';
import { Review, ReviewStatistics } from '@/types';

interface ReviewSectionProps {
  reviews: Review[];
  statistics: ReviewStatistics;
}

type FilterRating = 'all' | 'hasImage' | '5' | '4' | '3' | '2' | '1';
type SortBy = 'newest' | 'oldest' | 'highest' | 'lowest';

function ReviewSection({ reviews, statistics }: ReviewSectionProps) {
  const [filterRating, setFilterRating] = useState<FilterRating>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [visibleCount, setVisibleCount] = useState(5);
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // 篩選評價
  const getFilteredReviews = () => {
    let filtered = [...reviews];

    // 依星等篩選
    if (filterRating !== 'all') {
      if (filterRating === 'hasImage') {
        filtered = filtered.filter((r) => r.images && r.images.length > 0);
      } else {
        filtered = filtered.filter((r) => r.rating === parseInt(filterRating));
      }
    }

    // 排序
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'highest':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredReviews = getFilteredReviews();
  const displayedReviews = filteredReviews.slice(0, visibleCount);
  const hasMore = visibleCount < filteredReviews.length;

  // 載入更多
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  // 渲染星星
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        icon="star"
        className={i < rating ? styles.starFilled : styles.starEmpty}
      />
    ));
  };

  // 計算百分比
  const getPercentage = (count: number) => {
    if (statistics.total === 0) return 0;
    return (count / statistics.total) * 100;
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Lightbox 功能
  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxImages(null);
    setLightboxIndex(0);
  };

  const handleLightboxPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev === 0 ? (lightboxImages?.length || 1) - 1 : prev - 1));
  };

  const handleLightboxNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev === (lightboxImages?.length || 1) - 1 ? 0 : prev + 1));
  };

  return (
    <div className={styles.reviewSection}>
      {/* 區塊標題 */}
      <h2 className={styles.sectionTitle}>
        商品評價 ({statistics.total})
      </h2>

      {/* 評價統計 */}
      <div className={styles.statisticsSection}>
        <div className={styles.averageRating}>
          <span className={styles.averageValue}>{statistics.average.toFixed(1)}</span>
          <span className={styles.averageMax}>/5.0</span>
          <div className={styles.averageStars}>{renderStars(Math.round(statistics.average))}</div>
        </div>

        <div className={styles.ratingDistribution}>
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className={styles.distributionRow}>
              <span className={styles.starLabel}>{star} 星</span>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${getPercentage(statistics.distribution[star as keyof typeof statistics.distribution])}%` }}
                />
              </div>
              <span className={styles.countLabel}>{statistics.distribution[star as keyof typeof statistics.distribution]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 篩選與排序 */}
      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <label>篩選:</label>
          <Select
            value={filterRating}
            onChange={(value) => setFilterRating(value as FilterRating)}
            options={[
              { value: 'all', label: '全部' },
              { value: '5', label: '5 星' },
              { value: '4', label: '4 星' },
              { value: '3', label: '3 星' },
              { value: '2', label: '2 星' },
              { value: '1', label: '1 星' },
              { value: 'hasImage', label: '有圖片' },
            ]}
            variant="compact"
            ariaLabel="篩選評價"
          />
        </div>

        <div className={styles.filterGroup}>
          <label>排序:</label>
          <Select
            value={sortBy}
            onChange={(value) => setSortBy(value as SortBy)}
            options={[
              { value: 'newest', label: '最新優先' },
              { value: 'oldest', label: '最舊優先' },
              { value: 'highest', label: '評分最高' },
              { value: 'lowest', label: '評分最低' },
            ]}
            variant="compact"
            ariaLabel="排序方式"
          />
        </div>
      </div>

      {/* 評價列表 */}
      <div className={styles.reviewList}>
        {displayedReviews.length === 0 ? (
          <div className={styles.emptyReview}>目前沒有符合條件的評價</div>
        ) : (
          displayedReviews.map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              {/* 用戶資訊 */}
              <div className={styles.reviewHeader}>
                <div className={styles.userAvatar}>
                  {review.userAvatar ? (
                    <img src={review.userAvatar} alt={review.userName} />
                  ) : (
                    <Icon icon="user" />
                  )}
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{review.userName}</span>
                  <div className={styles.reviewMeta}>
                    <div className={styles.reviewStars}>{renderStars(review.rating)}</div>
                    <span className={styles.reviewDate}>{formatDate(review.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* 評論內容 */}
              {review.content && <p className={styles.reviewContent}>{review.content}</p>}

              {/* 評論圖片 */}
              {review.images && review.images.length > 0 && (
                <div className={styles.reviewImages}>
                  {review.images.map((img, index) => (
                    <div
                      key={index}
                      className={styles.reviewImageThumb}
                      onClick={() => openLightbox(review.images, index)}
                    >
                      <img src={img} alt={`評價圖片 ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 載入更多 */}
      {hasMore && (
        <div className={styles.loadMore}>
          <Button variant="outline" onClick={handleLoadMore}>
            載入更多
          </Button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImages && (
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
            <img src={lightboxImages[lightboxIndex]} alt={`放大檢視 ${lightboxIndex + 1}`} />
          </div>

          <Button
            iconOnly
            icon="chevron-right"
            onClick={handleLightboxNext}
            ariaLabel="下一張圖片"
            className={`${styles.lightboxNavButton} ${styles.lightboxNavButtonRight}`}
          />

          <div className={styles.lightboxCounter}>
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewSection;
