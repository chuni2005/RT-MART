/**
 * ReviewDialog 使用範例
 *
 * 此文件展示如何在不同場景中使用 ReviewDialog 組件
 */

import { useState } from 'react';
import ReviewDialog from './ReviewDialog';
import Button from '@/shared/components/Button';

// ============================================
// 範例 1: 基本使用 - 在商品詳情頁
// ============================================

function Example1_ProductDetailPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmitSuccess = () => {
    alert('評價提交成功！');
    // 可以在這裡刷新評價列表
  };

  return (
    <div>
      <Button onClick={() => setIsDialogOpen(true)}>
        撰寫評價
      </Button>

      <ReviewDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        productId="product_123"
        productName="Sony WH-1000XM5 無線降噪耳機"
        productImage="https://example.com/product.jpg"
        onSubmitSuccess={handleSubmitSuccess}
      />
    </div>
  );
}

// ============================================
// 範例 2: 在訂單列表中使用
// ============================================

interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
}

function Example2_OrderListPage() {
  const [selectedProduct, setSelectedProduct] = useState<OrderItem | null>(null);

  const orders: OrderItem[] = [
    {
      productId: 'p1',
      productName: 'Sony WH-1000XM5 無線降噪耳機',
      productImage: 'https://example.com/p1.jpg',
    },
    {
      productId: 'p2',
      productName: 'Apple AirPods Pro (第 2 代)',
      productImage: 'https://example.com/p2.jpg',
    },
  ];

  return (
    <div>
      {orders.map((order) => (
        <div key={order.productId}>
          <div>{order.productName}</div>
          <Button onClick={() => setSelectedProduct(order)}>
            撰寫評價
          </Button>
        </div>
      ))}

      {selectedProduct && (
        <ReviewDialog
          isOpen={true}
          onClose={() => setSelectedProduct(null)}
          productId={selectedProduct.productId}
          productName={selectedProduct.productName}
          productImage={selectedProduct.productImage}
          onSubmitSuccess={() => {
            alert('評價提交成功！');
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// 範例 3: 自動打開 Dialog（例如訂單收貨後提醒）
// ============================================

function Example3_AutoOpenDialog() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 模擬訂單完成後自動提醒評價
  const handleOrderComplete = () => {
    setTimeout(() => {
      setIsDialogOpen(true);
    }, 1000);
  };

  return (
    <div>
      <Button onClick={handleOrderComplete}>
        模擬訂單完成
      </Button>

      <ReviewDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        productId="product_456"
        productName="Bose QuietComfort 45 無線耳機"
        productImage="https://example.com/bose.jpg"
        onSubmitSuccess={() => {
          console.log('評價已提交');
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
}

// ============================================
// 範例 4: 帶刷新功能的完整範例
// ============================================

function Example4_WithRefresh() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  const fetchReviews = async () => {
    // 從 API 獲取評價列表
    // const data = await getReviewsByProductId('product_123');
    // setReviews(data.reviews);
  };

  const handleSubmitSuccess = () => {
    setIsDialogOpen(false);
    // 重新獲取評價列表
    fetchReviews();
  };

  return (
    <div>
      <Button onClick={() => setIsDialogOpen(true)}>
        撰寫評價
      </Button>

      <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review.id}>{review.content}</div>
        ))}
      </div>

      <ReviewDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        productId="product_123"
        productName="Sony WH-1000XM5 無線降噪耳機"
        productImage="https://example.com/sony.jpg"
        onSubmitSuccess={handleSubmitSuccess}
      />
    </div>
  );
}

// ============================================
// 範例 5: 在 React Context 中使用
// ============================================

// 創建一個全局的 Review Dialog Context
import { createContext, useContext, ReactNode } from 'react';

interface ReviewDialogContextType {
  openReviewDialog: (product: {
    id: string;
    name: string;
    image?: string;
  }) => void;
}

const ReviewDialogContext = createContext<ReviewDialogContextType | null>(null);

export function ReviewDialogProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
    productImage?: string;
  }>({
    isOpen: false,
    productId: '',
    productName: '',
  });

  const openReviewDialog = (product: {
    id: string;
    name: string;
    image?: string;
  }) => {
    setDialogState({
      isOpen: true,
      productId: product.id,
      productName: product.name,
      productImage: product.image,
    });
  };

  const closeDialog = () => {
    setDialogState({ ...dialogState, isOpen: false });
  };

  return (
    <ReviewDialogContext.Provider value={{ openReviewDialog }}>
      {children}
      <ReviewDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        productId={dialogState.productId}
        productName={dialogState.productName}
        productImage={dialogState.productImage}
        onSubmitSuccess={closeDialog}
      />
    </ReviewDialogContext.Provider>
  );
}

// 在任何組件中使用
export function useReviewDialog() {
  const context = useContext(ReviewDialogContext);
  if (!context) {
    throw new Error('useReviewDialog must be used within ReviewDialogProvider');
  }
  return context;
}

// 使用範例
function Example5_Component() {
  const { openReviewDialog } = useReviewDialog();

  return (
    <Button
      onClick={() =>
        openReviewDialog({
          id: 'product_789',
          name: 'Sennheiser Momentum 4 無線耳機',
          image: 'https://example.com/sennheiser.jpg',
        })
      }
    >
      撰寫評價
    </Button>
  );
}

// ============================================
// 匯出所有範例
// ============================================

export const examples = {
  Example1_ProductDetailPage,
  Example2_OrderListPage,
  Example3_AutoOpenDialog,
  Example4_WithRefresh,
  Example5_Component,
};
