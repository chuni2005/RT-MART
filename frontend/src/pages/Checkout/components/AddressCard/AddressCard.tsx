import type { Address } from "@/types";
import styles from "./AddressCard.module.scss";

interface AddressCardProps {
  address: Address;
  isDefault?: boolean;
  className?: string;
}

/**
 * AddressCard Component
 * 顯示收件地址資訊卡片
 *
 * @param address - 地址資料
 * @param isDefault - 是否為預設地址
 * @param className - 額外的 CSS class
 */
function AddressCard({
  address,
  isDefault = false,
  className = "",
}: AddressCardProps) {
  return (
    <div className={`${styles.addressCard} ${className}`}>
      {/* 預設標籤 */}
      {isDefault && <span className={styles.defaultBadge}>預設</span>}

      {/* 收件人資訊 */}
      <div className={styles.recipientInfo}>
        <h4 className={styles.name}>{address.recipientName}</h4>
        <span className={styles.phone}>{address.phone}</span>
      </div>

      {/* 地址 */}
      <p className={styles.address}>
        {address.city} {address.district} {address.postalCode}
        <br />
        {address.addressLine1} {address.addressLine2 || ""}
      </p>
    </div>
  );
}

export default AddressCard;
