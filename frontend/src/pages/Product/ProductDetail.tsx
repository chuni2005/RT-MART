import { useParams } from 'react-router-dom';
import styles from './ProductDetail.module.scss';
import ImageGallery from './components/ImageGallery';
import ProductInfo from './components/ProductInfo';
import PurchasePanel from './components/PurchasePanel';
import StoreSection from './components/StoreSection';
import ProductDescription from './components/ProductDescription';
import ReviewSection from './components/ReviewSection';
import { Product, Review, ReviewStatistics } from '@/types';

// Mock Data - 模擬商品資料
const mockProducts: Record<number, Product> = {
  1: {
    id: 1,
    name: '高品質無線藍牙耳機 - 降噪版',
    currentPrice: 1299,
    originalPrice: 1999,
    description: `採用最新藍牙5.3技術,支援主動降噪功能，讓您在嘈雜環境中也能享受純淨音質。

產品特色：
• 主動降噪技術，有效隔絕環境噪音
• 藍牙5.3連接，穩定不斷線
• 長達30小時續航力
• IPX5防水等級，運動流汗也不怕
• 符合人體工學設計，長時間配戴舒適

包裝內容：
- 藍牙耳機 x1
- 充電盒 x1
- USB-C充電線 x1
- 耳塞（大中小）各1組
- 使用說明書 x1

保固：一年保固服務`,
    stock: 150,
    rating: 4.8,
    reviewCount: 60,
    soldCount: 35,
    images: [
      'https://picsum.photos/600/600?random=1',
      'https://picsum.photos/600/600?random=2',
      'https://picsum.photos/600/600?random=3',
      'https://picsum.photos/600/600?random=4',
      'https://picsum.photos/600/600?random=5',
    ],
    store: {
      id: 'store_001',
      name: '科技生活旗艦店',
      avatar: 'https://i.pravatar.cc/150?img=10',
      productCount: 256,
      rating: 4.9,
      joinDate: '2022/03',
    },
    productType: {
      productTypeId: '4',
      typeCode: 'BLUETOOTH_HEADSET',
      typeName: '藍牙耳機',
      parentTypeId: '3',
      isActive: true,
      parent: {
        productTypeId: '3',
        typeCode: 'AUDIO_DEVICES',
        typeName: '音響設備',
        parentTypeId: '2',
        isActive: true,
        parent: {
          productTypeId: '2',
          typeCode: 'CONSUMER_ELECTRONICS',
          typeName: '消費性電子產品',
          parentTypeId: '1',
          isActive: true,
          parent: {
            productTypeId: '1',
            typeCode: 'ELECTRONICS',
            typeName: '3C電子',
            parentTypeId: null,
            isActive: true,
          },
        },
      },
    },
  },
  2: {
    id: 2,
    name: '超輕量運動水壺 - 750ml',
    currentPrice: 399,
    originalPrice: 599,
    description: `專為運動愛好者設計的輕量水壺，採用食品級不鏽鋼材質，安全無毒。

產品特色：
• 750ml大容量，滿足運動需求
• 雙層真空保溫，保冷保熱效果佳
• 超輕量設計，僅重280克
• 防漏設計，倒置不漏水
• 寬口設計，方便清洗和加冰塊

適用場景：
- 健身房運動
- 戶外登山
- 日常通勤
- 辦公室使用

清潔保養：
建議使用中性清潔劑清洗，避免使用鋼刷刮傷內層。`,
    stock: 85,
    rating: 4.5,
    reviewCount: 128,
    soldCount: 256,
    images: [
      'https://picsum.photos/600/600?random=6',
      'https://picsum.photos/600/600?random=7',
      'https://picsum.photos/600/600?random=8',
    ],
    store: {
      id: 'store_002',
      name: '運動生活館',
      avatar: 'https://i.pravatar.cc/150?img=20',
      productCount: 128,
      rating: 4.7,
      joinDate: '2023/06',
    },
    productType: {
      productTypeId: '8',
      typeCode: 'SPORT_BOTTLE',
      typeName: '運動水壺',
      parentTypeId: '7',
      isActive: true,
      parent: {
        productTypeId: '7',
        typeCode: 'SPORT_ACCESSORIES',
        typeName: '運動配件',
        parentTypeId: '6',
        isActive: true,
        parent: {
          productTypeId: '6',
          typeCode: 'SPORTS_FITNESS',
          typeName: '運動/健身',
          parentTypeId: '5',
          isActive: true,
          parent: {
            productTypeId: '5',
            typeCode: 'SPORTS_OUTDOOR',
            typeName: '運動戶外',
            parentTypeId: null,
            isActive: true,
          },
        },
      },
    },
  },
  3: {
    id: 3,
    name: '智能手環 - 健康監測版',
    currentPrice: 899,
    originalPrice: null,
    description: `全天候健康監測，陪伴您的每一天。24小時心率監測，睡眠品質分析，讓您更了解自己的身體狀況。

主要功能：
• 24小時心率監測
• 血氧濃度檢測
• 睡眠品質分析
• 運動模式多達12種
• 來電/訊息提醒
• IP68防水防塵
• 續航力長達14天

規格說明：
- 螢幕：1.1吋AMOLED彩色螢幕
- 電池容量：200mAh
- 充電時間：約2小時
- 相容系統：iOS 10.0+ / Android 5.0+

貼心提醒：
本產品非醫療器材，測量數據僅供參考。`,
    stock: 8,
    rating: 4.2,
    reviewCount: 45,
    soldCount: 89,
    images: [
      'https://picsum.photos/600/600?random=9',
      'https://picsum.photos/600/600?random=10',
      'https://picsum.photos/600/600?random=11',
      'https://picsum.photos/600/600?random=12',
    ],
    store: {
      id: 'store_003',
      name: '智慧穿戴專賣店',
      avatar: 'https://i.pravatar.cc/150?img=30',
      productCount: 89,
      rating: 4.8,
      joinDate: '2021/11',
    },
    productType: {
      productTypeId: '12',
      typeCode: 'SMART_BAND',
      typeName: '智能手環',
      parentTypeId: '11',
      isActive: true,
      parent: {
        productTypeId: '11',
        typeCode: 'WEARABLE_DEVICES',
        typeName: '穿戴裝置',
        parentTypeId: '10',
        isActive: true,
        parent: {
          productTypeId: '10',
          typeCode: 'SMART_DEVICES',
          typeName: '智能設備',
          parentTypeId: '1',
          isActive: true,
          parent: {
            productTypeId: '1',
            typeCode: 'ELECTRONICS',
            typeName: '3C電子',
            parentTypeId: null,
            isActive: true,
          },
        },
      },
    },
  },
};

// Mock Data - 模擬評價資料
const mockReviews: Review[] = [
  {
    id: 'review_001',
    userId: 'user_001',
    userName: '王小明',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    rating: 5,
    content: '商品品質非常好，音質清晰，降噪效果出色！戴了整天也不會覺得耳朵痛，非常推薦給需要長時間使用耳機的朋友。',
    images: [
      'https://picsum.photos/300/300?random=101',
      'https://picsum.photos/300/300?random=102',
    ],
    createdAt: '2025-01-15T10:30:00Z',
  },
  {
    id: 'review_002',
    userId: 'user_002',
    userName: '李美麗',
    userAvatar: 'https://i.pravatar.cc/150?img=5',
    rating: 4,
    content: '整體來說很滿意，連線穩定，電池續航力也不錯。唯一小缺點是充電盒有點大，不太好放口袋。',
    images: [],
    createdAt: '2025-01-10T14:20:00Z',
  },
  {
    id: 'review_003',
    userId: 'user_003',
    userName: '張大偉',
    userAvatar: null,
    rating: 5,
    content: '超值！這個價格買到這樣的品質真的很划算，降噪效果比預期的還要好。',
    images: [
      'https://picsum.photos/300/300?random=103',
    ],
    createdAt: '2025-01-08T09:15:00Z',
  },
  {
    id: 'review_004',
    userId: 'user_004',
    userName: '陳小華',
    userAvatar: 'https://i.pravatar.cc/150?img=8',
    rating: 5,
    content: '第二次購買了，送給家人用的。品質穩定，客服態度也很好！',
    images: [],
    createdAt: '2025-01-05T16:45:00Z',
  },
  {
    id: 'review_005',
    userId: 'user_005',
    userName: '林志玲',
    userAvatar: 'https://i.pravatar.cc/150?img=9',
    rating: 4,
    content: '音質不錯，配戴舒適，就是剛開始藍牙配對花了一點時間。',
    images: [],
    createdAt: '2025-01-03T11:30:00Z',
  },
  {
    id: 'review_006',
    userId: 'user_006',
    userName: '吳宗翰',
    userAvatar: 'https://i.pravatar.cc/150?img=12',
    rating: 3,
    content: '商品是不錯，但包裝有點簡陋，希望能加強一下。',
    images: [],
    createdAt: '2024-12-28T13:00:00Z',
  },
  {
    id: 'review_007',
    userId: 'user_007',
    userName: '黃小婷',
    userAvatar: 'https://i.pravatar.cc/150?img=16',
    rating: 5,
    content: '非常滿意！降噪效果一級棒，通勤時用超讚的。',
    images: [
      'https://picsum.photos/300/300?random=104',
      'https://picsum.photos/300/300?random=105',
      'https://picsum.photos/300/300?random=106',
    ],
    createdAt: '2024-12-25T08:20:00Z',
  },
  {
    id: 'review_008',
    userId: 'user_008',
    userName: '周杰倫',
    userAvatar: 'https://i.pravatar.cc/150?img=18',
    rating: 5,
    content: '音質真的很好，推薦給喜歡聽音樂的朋友！',
    images: [],
    createdAt: '2024-12-20T15:10:00Z',
  },
];

// Mock Data - 模擬評價統計
const mockStatistics: ReviewStatistics = {
  average: 4.5,
  total: 150,
  distribution: {
    5: 98,
    4: 32,
    3: 12,
    2: 5,
    1: 3,
  },
};

function ProductDetail() {
  const { product_id } = useParams<{ product_id: string }>();

  // 從 Mock Data 取得商品資料
  const product = mockProducts[Number(product_id)] || mockProducts[1];

  return (
    <div className={styles.productDetail}>
      <div className={styles.container}>
        {/* 上方區塊：圖片 + 商品資訊 + 購買操作 */}
        <div className={styles.contentWrapper}>
          {/* 左側：圖片輪播區 */}
          <div className={styles.leftSection}>
            <ImageGallery images={product.images} />
          </div>

          {/* 右側：商品資訊 + 購買操作 */}
          <div className={styles.rightSection}>
            <ProductInfo
              name={product.name}
              currentPrice={product.currentPrice}
              originalPrice={product.originalPrice}
              rating={product.rating}
              reviewCount={product.reviewCount}
              soldCount={product.soldCount}
            />

            <PurchasePanel stock={product.stock} productId={product.id} productData={product} />
          </div>
        </div>

        {/* 商店區塊 */}
        <StoreSection store={product.store} />

        {/* 商品資訊詳細區 */}
        <ProductDescription
          description={product.description}
          stock={product.stock}
          productType={product.productType}
          brand="PUMA"
          origin="桃園市大園區"
        />

        {/* 商品評價區 */}
        <ReviewSection reviews={mockReviews} statistics={mockStatistics} />
      </div>
    </div>
  );
}

export default ProductDetail;
