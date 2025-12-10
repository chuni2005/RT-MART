/
/
Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

/
/
RT-Mart E-Commerce Platform Database Schema
// ==========================================
// 1. 使用者體系 (User System)
// ==========================================

Table User {
  user_id bigint [pk, increment]
  login_id varchar(50) [unique, not null]
  password_hash varchar(255) [not null]
  name varchar(100) [not null]
  email varchar(100) [unique, not null]
  phone_number varchar(20)
  role enum('buyer', 'seller', 'admin') [not null]
  deleted_at timestamp [null]
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [default: `CURRENT_TIMESTAMP`]
}

Table Seller {
  seller_id bigint [pk, increment]
  user_id bigint [not null, unique]
  bank_account_reference varchar(255)
  verified boolean [default: false]
  verified_at timestamp [null]
  verified_by bigint [null] // 後端檢查角色為 admin

}
Ref: Seller.user_id - User.user_id [delete: cascade]
Ref: Seller.verified_by > User.user_id [delete: set null]

Table ShippingAddress {
  address_id bigint [pk, increment]
  user_id bigint [not null]
  recipient_name varchar(100) [not null]
  phone varchar(20) [not null]
  city varchar(50) [not null]
  district varchar(50)
  postal_code varchar(10)
  address_line1 varchar(255) [not null]
  address_line2 varchar(255)
  is_default boolean [default: false]  // 預設地址
  
  indexes {
    user_id
    (user_id, is_default)
  }
  note: "一個 User 可以有多個 ShippingAddress" 
}
Ref: ShippingAddress.user_id > User.user_id [delete: cascade]

Table UserToken {
  token_id bigint [pk, increment]
  user_id bigint [not null]
  token_hash varchar(255) [unique, not null]
  expires_at timestamp [not null]
  is_revoked boolean [default: false]
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  
  indexes {
    user_id
    token_hash
    (user_id, is_revoked, expires_at)
  }
  note: "可以定期清理過期的token"
}

Ref: UserToken.user_id > User.user_id [delete: cascade]

/
/
==========================================
// 2. 商店與商品 (Store & Product)
// ==========================================

Table Store {
  store_id bigint [pk, increment]
  seller_id bigint [not null]
  store_name varchar(200) [not null]
  store_description text
  store_address text
  store_email varchar(100)
  store_phone varchar(20)
  average_rating decimal(2,1) [default: 0.0]
  total_ratings int [default: 0]
  deleted_at timestamp [null]
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [default: `CURRENT_TIMESTAMP`]
  
  indexes {
    seller_id
    store_name [type: btree]
    (deleted_at, average_rating) [note: 'for active stores ranking']
  }
  
  note: '商店資料'
}
Ref: Store.seller_id - Seller.seller_id [delete: restrict]  // 軟刪除store，因爲可能還有其商品在cart/order

Table ProductType {
  product_type_id bigint [pk, increment]
  type_code varchar(50) [unique, not null]  // 代碼
  type_name varchar(100) [not null]
  parent_type_id bigint [null]
  is_active boolean [default: true]
  
  indexes {
    type_code
    parent_type_id
  }
  
  note: '商品類型'
}
Ref: ProductType.parent_type_id > ProductType.product_type_id [delete: cascade]

Table Product {
  product_id bigint [pk, increment]
  store_id bigint [not null]
  product_type_id bigint [not null]
  product_name varchar(200) [not null]
  description text
  price decimal(10,2) [not null]
  sold_count bigint [default: 0]  // 瀏覽量
  average_rating decimal(2,1) [default: 0.0]
  total_reviews int [default: 0]  // 評論數量
  deleted_at timestamp [null]   // 下架時設定這個
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [default: `CURRENT_TIMESTAMP`]
  
  indexes {
    store_id
    product_type_id
    product_name [type: btree]
    (store_id, product_type_id)
    (price, deleted_at) [note: 'price range queries for active products']
  }
  
  note: '商品資料：支援軟刪除=不會真正地刪除'
}
Ref: Product.store_id > Store.store_id [delete: restrict]
Ref: Product.product_type_id > ProductType.product_type_id [delete: restrict]

Table ProductImage {
  image_id bigint  [pk, increment]
  product_id bigint  [not null]
  image_url varchar(500) [not null]
  display_order int [not null, default: 1]
  
  indexes {
    product_id
    (product_id, display_order)
  }
  
  note: '商品圖片（支援多張圖片）'
}
Ref: ProductImage.product_id > Product.product_id [delete: cascade]

/
/
==========================================
// 2.1. 庫存管理系統
// ==========================================

Table Inventory {
  inventory_id bigint [pk, increment]
  product_id bigint [not null, unique]
  quantity int [not null, default: 0, note: '可用庫存']
  reserved int [not null, default: 0, note: '已預留但未提交']
  last_updated timestamp [not null, default: `CURRENT_TIMESTAMP`]
  
  indexes {
    product_id
  }
  
  note: '''即時庫存表（關鍵表）
  quantity = 實際可售數量
  reserved = 已預留但未完成付款的數量'''
}
Ref: Inventory.product_id - Product.product_id [delete: cascade]

/
/
==========================================
// 3. 購物車系統 (Shopping Cart)
// ==========================================

Table Cart { 
  cart_id bigint [pk, increment]
  user_id bigint [not null, unique]
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [default: `CURRENT_TIMESTAMP`]
  
  note: '購物車（一個買家一個購物車）'
}
Ref: Cart.user_id - User.user_id [delete: cascade]

Table CartItem {
  cart_item_id bigint [pk, increment]
  cart_id bigint [not null]
  product_id bigint [not null]
  quantity int [not null]
  added_at timestamp [default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [default: `CURRENT_TIMESTAMP`]
  
  indexes {
    cart_id
    (cart_id, product_id) [unique]
  }
  
  note: '購物車項目'
}
Ref: CartItem.cart_id > Cart.cart_id [delete: cascade]
Ref: CartItem.product_id > Product.product_id [delete: restrict] // 商品可能只是下架-應該保留購物車，讓用戶看到「商品已下架」

Table CartHistory {
  cart_history_id bigint [pk, increment]
  user_id bigint [not null]
  cart_snapshot json [not null, note: '完整的購物車 JSON 資料（包含商品、數量、價格、選項等）']
  item_count int [not null, note: '購物車內的商品總數（方便快速查詢）']
  order_ids json [null, note: '若購物車成功轉換為訂單，記錄對應的訂單ID清單']
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  
  indexes {
    user_id
    created_at
  }
  
  note: '''購物車歷史記錄-用於恢復購物車
    用途：
    - 每次使用者結帳、清空購物車、或主動儲存購物車時，
      系統會將當前購物車完整內容以快照（cart_snapshot）形式保存，
      以便日後可恢復購物車或查詢當時購物內容。

    應用場景：
    1. 查詢使用者當時結帳或放棄購物時的商品明細，方便加回購物車
    2. 協助追蹤轉單行為（cart → order）。

    刪除行為：
    - 若使用者被刪除，對應的購物車歷史資料一併刪除（on delete cascade）。
  '''
}
Ref: CartHistory.user_id > User.user_id [delete: cascade]

/
/
==========================================
// 4. 訂單系統 (Order System)
// ==========================================

Table Order {
  order_id bigint [pk, increment]
  order_number varchar(50) [unique, not null, note: '對外顯示的訂單號']
  user_id bigint [not null]
  store_id bigint [not null]

/
/
訂單狀態（包含付款狀態）
  order_status enum(
    'pending_payment',  // 待付款（剛下單，還沒付款）
    'payment_failed',   // 付款失敗
    'paid',             // 已付款（付款成功）
    'processing',       // 處理中（賣家準備商品）
    'shipped',          // 已出貨
    'delivered',        // 已送達
    'completed',        // 已完成（買家確認收貨）
    'cancelled'         // 已取消
  ) [not null, default: 'pending_payment']

  subtotal decimal(10,2) [not null]
  shipping_fee decimal(10,2) [not null, default: 60]
  total_discount decimal(10,2) [default: 0]
  total_amount decimal(10,2) [not null, note: "總"]
  payment_method varchar(50)
  payment_reference varchar(255) [null, note: '金流商訂單號']  
  idempotency_key varchar(128) [unique, null, note: '冪等性鍵-防止重複下單的鍵（可移除）']  
  shipping_address_snapshot json [not null, note: '配送地址快照']
  notes text [null]

  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  updated_at timestamp [default: `CURRENT_TIMESTAMP`]
  paid_at timestamp [null]
  shipped_at timestamp [null]
  delivered_at timestamp [null]
  completed_at timestamp [null]
  cancelled_at timestamp [null]
  
  indexes {
    order_number
    user_id
    store_id
    order_status
    idempotency_key
    created_at
    (user_id, created_at)
    (store_id, created_at)
  }
  
  note: '訂單主表'
}
Ref: Order.user_id > User.user_id [delete: restrict]
Ref: Order.store_id > Store.store_id [delete: restrict]

Table OrderItem {
  order_item_id bigint [pk, increment]
  order_id bigint [not null]
  product_id bigint [null]
  product_snapshot json [not null, note:"保存「當下商品狀態」--> 因爲商家後續可能會更改商品資訊"]
  quantity int [not null]

/
/
價格資訊
  original_price decimal(10,2) [not null, note: '商品原價']
  item_discount decimal(10,2) [default: 0, note: '商品本身的折扣 = original_price - unit_price']
  unit_price decimal(10,2) [not null, note: '實際單價（可能是特價）']
  subtotal decimal(10,2) [not null, note: 'unit_price × quantity']
  
  indexes {
    order_id
    product_id
  }
  
  note: '''訂單項目
  範例：iPhone 原價 $35000，特價 $30000，買 2 個
  - original_price = 35000
  - unit_price = 30000
  - item_discount = 5000
  - subtotal = 30000 × 2 = 60000
  
  訂單層級的折扣（coupon）記錄在 OrderDiscount 表'''
}
Ref: OrderItem.order_id > Order.order_id [delete: cascade]
Ref: OrderItem.product_id > Product.product_id [delete: set null]

/
/
==========================================
// 5. 折扣系統 (Discount System)
// ==========================================

Table Discount {
  discount_id bigint [pk, increment]
  discount_code varchar(50) [unique, not null]
  discount_type enum('seasonal', 'shipping', 'special') [not null]
  name varchar(200) [not null]
  description text
  min_purchase_amount decimal(10,2) [not null, default: 0, note: "最低消費"]
  start_datetime timestamp [not null]
  end_datetime timestamp [not null]
  is_active boolean [default: true]
  usage_limit int [null]
  usage_count int [default: 0]  // 使用計數
  created_by_type enum('system', 'seller') [not null]
  created_by_id bigint [null, note: 'NULL: admin(system), seller_id:seller']
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  
  indexes {
    discount_code
    discount_type
    (discount_type, is_active, start_datetime, end_datetime)
    (created_by_type, created_by_id)
  }
  
  note: '折扣基本資料（所有折扣共通屬性）'
}

Table SeasonalDiscount {
  seasonal_discount_id bigint [pk, increment]
  discount_id bigint [not null, unique]
  discount_rate decimal(5,4) [not null]
  max_discount_amount decimal(10,2) [null, note: '最高折扣上限']
  
  note: '季節折扣（admin 設置，百分比制）'
}
Ref: SeasonalDiscount.discount_id - Discount.discount_id [delete: cascade]

Table ShippingDiscount {
  shipping_discount_id bigint [pk, increment]
  discount_id bigint [not null, unique]
  discount_amount decimal(10,2) [not null]
  
  note: '運費折扣（admin 設置，固定金額制）'
}
Ref: ShippingDiscount.discount_id - Discount.discount_id [delete: cascade]

Table SpecialDiscount {
  special_discount_id bigint [pk, increment]
  discount_id bigint [not null, unique]
  store_id bigint [not null]
  product_type_id bigint [null]
  discount_rate decimal(5,4) [null]
  max_discount_amount decimal(10,2) [null, note: '最高折扣上限']
  
  indexes {
    store_id
    product_type_id
    (store_id, product_type_id, discount_id) [unique]
  }
  
  note: '商家活動折扣（商家設置，百分比制）'
}
Ref: SpecialDiscount.discount_id - Discount.discount_id [delete: cascade]
Ref: SpecialDiscount.store_id > Store.store_id [delete: cascade]
Ref: SpecialDiscount.product_type_id > ProductType.product_type_id [delete: restrict]

/
/
中介表（junction table）
Table OrderDiscount {
  order_discount_id bigint [pk, increment]
  order_id bigint [not null]
  discount_id bigint [not null]
  discount_type enum('seasonal', 'shipping', 'special') [not null]
  discount_amount decimal(10,2) [not null]
  applied_at timestamp [default: `CURRENT_TIMESTAMP`]
  
  indexes {
    order_id
    discount_id
    (order_id, discount_type) [unique]
  }
  
  note: '訂單套用的折扣記錄'
}
Ref: OrderDiscount.order_id > Order.order_id [delete: cascade]
Ref: OrderDiscount.discount_id > Discount.discount_id [delete: restrict]

/
/
==========================================
// 6. 審計系統 (Audit System) （可移除）
// ==========================================

Table AuditLog {
  audit_id bigint [pk, increment]
  event_id char(36) [not null, unique, note: 'Unique event identifier']
  event_timestamp timestamp [not null, default: `CURRENT_TIMESTAMP`]
  table_name varchar(100) [not null]
  record_id bigint [not null]
  action varchar(20) [not null]
  user_id bigint [null]
  // 結構化 metadata
  request_id varchar(128) [null, note: 'API request ID']
  ip_address varchar(45) [null, note: 'IP address (IPv4 or IPv6)']
  user_agent text [null]
  service_name varchar(50) [null]
  // 資料變更
  old_data json [null]
  new_data json [null]
  changes json [null, note: '計算出的變更差異']
  // 防竄改
  checksum varchar(64) [null, note: 'SHA-256 of concatenated fields']
  
  indexes {
    event_id
    (table_name, record_id)
    user_id
    event_timestamp
    request_id
  }
  
  note: '''審計日誌表（關鍵安全表）
  - 必須設定為 APPEND ONLY（只允許 INSERT）
  - 定期歸檔到冷存儲'''
}
Ref: AuditLog.user_id > User.user_id [delete: set null]

/
/
> : 多對一（N:1）
// < : 一對多（1:N）
// - : 一對一（1:1）
// <> : 多對多（需要中間表）

Ref: "Order"."order_id" < "Order"."shipping_fee"