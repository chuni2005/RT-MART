import type { ItemListCardProps } from '@/types';
import styles from './ItemListCard.module.scss';
import Icon from '@/shared/components/Icon';

function ItemListCard(props: ItemListCardProps) {
  const { variant, item, onClick } = props;

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

    const handleQuantityDecrease = () => {
      if (editable && onQuantityChange && item.quantity > 1) {
        onQuantityChange(item.quantity - 1);
      }
    };

    const handleQuantityIncrease = () => {
      if (editable && onQuantityChange && item.quantity < item.stock) {
        onQuantityChange(item.quantity + 1);
      }
    };

    return (
      <div className={styles.itemListCard} data-variant="cart">
        {/* 選擇框 */}
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

        {/* 商品圖片 */}
        <div className={styles.productImage} onClick={onClick}>
          {item.productImage ? (
            <img src={item.productImage} alt={item.productName} />
          ) : (
            <div className={styles.placeholder}>商品圖片</div>
          )}
        </div>

        {/* 商品信息 */}
        <div className={styles.productInfo}>
          <h4 className={styles.productName} onClick={onClick}>
            {item.productName}
          </h4>
          <p className={styles.price}>NT$ {item.price}</p>

          {/* 數量調整器 */}
          {editable && (
            <div className={styles.quantityControl}>
              <button
                type="button"
                onClick={handleQuantityDecrease}
                disabled={item.quantity <= 1}
                aria-label="減少數量"
              >
                <Icon icon="minus" size="sm" />
              </button>
              <input
                type="number"
                value={item.quantity}
                readOnly
                aria-label="商品數量"
              />
              <button
                type="button"
                onClick={handleQuantityIncrease}
                disabled={item.quantity >= item.stock}
                aria-label="增加數量"
              >
                <Icon icon="plus" size="sm" />
              </button>
            </div>
          )}

          {/* 小計 */}
          <p className={styles.subtotal}>
            小計: <span>NT$ {item.price * item.quantity}</span>
          </p>

          {/* 庫存提示 */}
          {item.stock < 10 && (
            <p className={styles.stockWarning}>僅剩 {item.stock} 件</p>
          )}
        </div>

        {/* 刪除按鈕 */}
        {deletable && (
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={onDelete}
            aria-label="刪除商品"
          >
            <Icon icon="trash" />
          </button>
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
