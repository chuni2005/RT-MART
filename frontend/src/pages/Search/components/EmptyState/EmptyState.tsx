import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/shared/components/Icon/Icon';
import Button from '@/shared/components/Button/Button';
import styles from './EmptyState.module.scss';

export interface EmptyStateProps {
  keyword: string;
  categoryName?: string;
}

function EmptyState({ keyword, categoryName }: EmptyStateProps) {
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate('/');
  };

  // 根據是否有關鍵字或分類顯示不同的訊息
  const getTitle = () => {
    if (keyword && categoryName) {
      return `找不到符合 "${keyword}" 的${categoryName}商品`;
    } else if (keyword) {
      return `找不到符合 "${keyword}" 的商品`;
    } else if (categoryName) {
      return `${categoryName}分類目前沒有商品`;
    } else {
      return '找不到商品';
    }
  };

  const getSuggestions = () => {
    if (keyword) {
      return (
        <>
          <li>檢查關鍵字是否正確</li>
          <li>使用不同的關鍵字</li>
          <li>瀏覽熱門商品</li>
        </>
      );
    } else if (categoryName) {
      return (
        <>
          <li>選擇其他分類</li>
          <li>清除所有篩選條件</li>
          <li>瀏覽所有商品</li>
        </>
      );
    } else {
      return (
        <>
          <li>調整篩選條件</li>
          <li>清除所有篩選</li>
          <li>瀏覽熱門商品</li>
        </>
      );
    }
  };

  return (
    <div className={styles.emptyState}>
      <Icon icon="search" className={styles.emptyIcon} />
      <h3 className={styles.emptyTitle}>{getTitle()}</h3>
      <div className={styles.emptyMessage}>
        <p>請嘗試：</p>
        <ul>
          {getSuggestions()}
        </ul>
      </div>
      <Button
        variant="primary"
        onClick={handleBackHome}
        className={styles.backButton}
      >
        返回首頁
      </Button>
    </div>
  );
}

export default EmptyState;
