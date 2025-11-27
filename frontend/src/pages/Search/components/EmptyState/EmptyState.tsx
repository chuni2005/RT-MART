import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/shared/components/Icon/Icon';
import Button from '@/shared/components/Button/Button';
import styles from './EmptyState.module.scss';

export interface EmptyStateProps {
  keyword: string;
}

function EmptyState({ keyword }: EmptyStateProps) {
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate('/');
  };

  return (
    <div className={styles.emptyState}>
      <Icon icon="search" className={styles.emptyIcon} />
      <h3 className={styles.emptyTitle}>找不到符合 "{keyword}" 的商品</h3>
      <div className={styles.emptyMessage}>
        <p>請嘗試：</p>
        <ul>
          <li>檢查關鍵字是否正確</li>
          <li>使用不同的關鍵字</li>
          <li>瀏覽熱門商品</li>
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
