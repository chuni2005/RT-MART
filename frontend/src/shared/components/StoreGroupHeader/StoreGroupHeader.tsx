import { useNavigate } from 'react-router-dom';
import styles from './StoreGroupHeader.module.scss';
import Icon from '../Icon';
import type { StoreGroupHeaderProps } from '@/types';

function StoreGroupHeader({
  storeId,
  storeName,
  allSelected,
  onSelectAll,
  onStoreClick,
}: StoreGroupHeaderProps) {
  const navigate = useNavigate();

  const handleStoreClick = () => {
    if (onStoreClick) {
      onStoreClick();
    } else {
      navigate(`/store/${storeId}`);
    }
  };

  return (
    <div className={styles.storeGroupHeader}>
      {/* Store Selection Checkbox */}
      <div className={styles.storeSelect}>
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(e) => onSelectAll(e.target.checked)}
          aria-label={`選擇 ${storeName} 的所有商品`}
        />
      </div>

      {/* Store Info - Clickable */}
      <div className={styles.storeInfo} onClick={handleStoreClick}>
        <Icon icon="store" size="lg" className={styles.storeIcon} />
        <h3 className={styles.storeName}>{storeName}</h3>
      </div>
    </div>
  );
}

export default StoreGroupHeader;
