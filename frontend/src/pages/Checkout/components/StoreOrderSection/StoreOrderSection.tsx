import styles from './StoreOrderSection.module.scss';
import Icon from '@/shared/components/Icon';
import ItemListCard from '@/shared/components/ItemListCard';
import type { StoreOrderSectionProps } from '../../../../types/checkout';

function StoreOrderSection({ storeGroup, note, onNoteChange }: StoreOrderSectionProps) {
  return (
    <div className={styles.storeOrderSection}>
      {/* 商店標題 */}
      <div className={styles.storeHeader}>
        <Icon icon="store" size="lg" className={styles.storeIcon} />
        <h3 className={styles.storeName}>{storeGroup.storeName}</h3>
      </div>

      {/* 商品列表 */}
      <div className={styles.itemList}>
        {storeGroup.items.map((item) => (
          <ItemListCard
            key={item.id}
            variant="order-detail"
            item={item}
          />
        ))}
      </div>

      {/* 商店專屬備註 */}
      <div className={styles.storeNote}>
        <label htmlFor={`note-${storeGroup.storeId}`} className={styles.noteLabel}>
          給 {storeGroup.storeName} 的備註
        </label>
        <textarea
          id={`note-${storeGroup.storeId}`}
          className={styles.noteTextarea}
          value={note}
          onChange={(e) => onNoteChange(storeGroup.storeId, e.target.value)}
          placeholder="選填，最多 50 字"
          maxLength={50}
          rows={2}
        />
        <div className={styles.charCount}>{note.length} / 50</div>
      </div>

      {/* 商店小計 */}
      <div className={styles.storeSubtotal}>
        <div className={styles.row}>
          <span>商品總額</span>
          <span>$ {storeGroup.subtotal}</span>
        </div>
        <div className={styles.row}>
          <span>運費</span>
          <span className={storeGroup.shipping === 0 ? styles.free : ''}>
            {storeGroup.shipping === 0 ? '免運' : `$ ${storeGroup.shipping}`}
          </span>
        </div>
        <div className={styles.divider} />
        <div className={`${styles.row} ${styles.total}`}>
          <span>小計</span>
          <span className={styles.totalAmount}>$ {storeGroup.total}</span>
        </div>
      </div>
    </div>
  );
}

export default StoreOrderSection;
