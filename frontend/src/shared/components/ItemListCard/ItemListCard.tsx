import type { ItemListCardProps } from '@/types';
import styles from './ItemListCard.module.scss';
import Button from '../Button';
import QuantitySelector from '../QuantitySelector';

function ItemListCard(props: ItemListCardProps) {
  const { variant, item, onClick, className } = props;

  // 購物車變體
  if (variant === 'cart') {
    const {
      selectable,
      onSelect,
      editable,
      onQuantityChange,
      deletable,
      onDelete,
    } = props as ItemListCardProps & {
      selectable?: boolean;
      onSelect?: (selected: boolean) => void;
      editable?: boolean;
      onQuantityChange?: (quantity: number) => void;
      deletable?: boolean;
      onDelete?: () => void;
    };

    const handleQuantityChange = (newQuantity: number | string) => {
      const numQuantity = typeof newQuantity === 'string' ? parseInt(newQuantity, 10) : newQuantity;
      if (editable && onQuantityChange) {
        onQuantityChange(numQuantity);
      }
    };

    const subtotal = item.price * item.quantity;

    return (
      <div
        className={`${styles.itemListCard} ${className || ''}`}
        data-variant="cart"
      >
        {/* Checkbox */}
        {selectable && (
          <div className={styles.selectBox}>
            <input
              type="checkbox"
              checked={item.selected}
              onChange={(e) => onSelect?.(e.target.checked)}
              aria-label={`選擇 ${item.productName}`}
            />
          </div>
        )}

        {/* Product Image - Clickable */}
        <div className={styles.productImage} onClick={onClick}>
          {item.productImage ? (
            <img src={item.productImage} alt={item.productName} />
          ) : (
            <div className={styles.placeholder}>商品圖片</div>
          )}
        </div>

        {/* Product Info - Horizontal Grid Layout */}
        <div className={styles.productInfo}>
          {/* Product Name */}
          <div className={styles.productName} onClick={onClick}>
            <h4>{item.productName}</h4>
          </div>

          {/* Unit Price */}
          <div className={styles.unitPrice}>
            <span className={styles.priceLabel}>單價</span>
            <p className={styles.price}>NT$ {item.price}</p>
          </div>

          {/* Quantity */}
          <div className={styles.quantityWrapper}>
            <span className={styles.quantityLabel}>數量</span>
            {editable ? (
              <QuantitySelector
                value={item.quantity}
                onChange={handleQuantityChange}
                max={item.stock}
                min={1}
                size="md"
              />
            ) : (
              <span className={styles.quantityDisplay}>{item.quantity}</span>
            )}
          </div>

          {/* Subtotal */}
          <div className={styles.subtotalWrapper}>
            <span className={styles.subtotalLabel}>小計</span>
            <p className={styles.subtotal}>
              <span>NT$ {subtotal}</span>
            </p>
          </div>

          {/* Stock Warning - Spans full width */}
          {item.stock < 10 && (
            <div className={styles.stockWarning}>
              <p>僅剩 {item.stock} 件</p>
            </div>
          )}
        </div>

        {/* Delete Button */}
        {deletable && (
          <Button
            type="button"
            className={styles.deleteBtn}
            onClick={onDelete}
            aria-label="刪除商品"
            iconOnly
            icon="trash"
          />
        )}
      </div>
    );
  }

  // TODO: 訂單列表變體
  if (variant === 'order-list') {
    return <div>Order List Variant - Coming Soon</div>;
  }

  // TODO: 訂單詳情變體
  if (variant === 'order-detail') {
    return <div>Order Detail Variant - Coming Soon</div>;
  }

  return null;
}

export default ItemListCard;
