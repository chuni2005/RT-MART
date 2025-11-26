import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import styles from './StoreSection.module.scss';
import Button from '@/shared/components/Button';
import Icon from '@/shared/components/Icon/Icon';
import { Store } from '@/types';

interface StoreSectionProps {
  store: Store;
  variant?: 'compact' | 'detailed';
  hideButton?: boolean;
}

function StoreSection({ store, variant = 'compact', hideButton = false }: StoreSectionProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const navigate = useNavigate();
  const handleViewStore = () => {
    navigate(`/store/${store.id}`);
  };
    
  const isDetailed = variant === 'detailed';

  return (
    <div className={`${styles.storeSection} ${isDetailed ? styles.detailed : ''}`}>
      <div className={styles.storeInfo}>
        {/* 商店頭像 */}
        <div className={styles.storeAvatar}>
          {store.avatar ? (
            <img src={store.avatar} alt={store.name} />
          ) : (
            <Icon icon="store" />
          )}
        </div>

        {/* 商店詳情 */}
        <div className={styles.storeDetails}>
          <h3 className={styles.storeName}>{store.name}</h3>
          <div className={styles.storeStats}>
            <span className={styles.statItem}>
              商品數: <strong>{store.productCount}</strong>
            </span>
            <span className={styles.divider}>|</span>
            <span className={styles.statItem}>
              評價: <Icon icon="star" className={styles.starIcon} />{" "}
              <strong>{store.rating}</strong>
              {isDetailed && store.totalRatings !== undefined && (
                <span className={styles.totalRatings}> ({store.totalRatings})</span>
              )}
            </span>
          </div>
          <div className={styles.joinDate}>加入時間: {store.joinDate}</div>

          {/* Detailed variant: 商店描述 */}
          {isDetailed && store.description && (
            <div className={styles.storeDescription}>
              <p className={isDescriptionExpanded ? styles.expanded : styles.collapsed}>
                {store.description}
              </p>
              {store.description.length > 100 && (
                <button
                  className={styles.expandButton}
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                >
                  {isDescriptionExpanded ? '收起' : '展開更多'}
                </button>
              )}
            </div>
          )}

          {/* Detailed variant: 联系信息 */}
          {isDetailed && (store.address || store.email || store.phone) && (
            <div className={styles.contactInfo}>
              {store.address && (
                <div className={styles.contactItem}>
                  <Icon icon="location-dot" />
                  <span>{store.address}</span>
                </div>
              )}
              {store.email && (
                <div className={styles.contactItem}>
                  <Icon icon="envelope" />
                  <span>{store.email}</span>
                </div>
              )}
              {store.phone && (
                <div className={styles.contactItem}>
                  <Icon icon="phone" />
                  <span>{store.phone}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 查看商店按鈕 */}
      {!hideButton && (
        <div className={styles.storeAction}>
          <Button variant="outline" onClick={handleViewStore} className={styles.viewStoreBtn}>
            查看商店
          </Button>
        </div>
      )}
    </div>
  );
}

export default StoreSection;
